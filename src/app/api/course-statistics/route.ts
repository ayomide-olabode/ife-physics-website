import { NextResponse } from 'next/server';
import { COURSE_STATISTICS_APPS_SCRIPT_URL } from '@/lib/course-statistics/config';
import {
  normalizeSubmissionRows,
  toCourseStatisticsAppsScriptPayload,
} from '@/lib/course-statistics/transform';
import { courseStatisticsSubmissionPayloadSchema } from '@/lib/course-statistics/validation';

const APPS_SCRIPT_URL =
  process.env.COURSE_STATISTICS_APPS_SCRIPT_URL?.trim() || COURSE_STATISTICS_APPS_SCRIPT_URL;
const APPS_SCRIPT_TIMEOUT_MS = Math.max(
  5000,
  Number(process.env.COURSE_STATISTICS_APPS_SCRIPT_TIMEOUT_MS || 12000) || 12000,
);
const APPS_SCRIPT_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.COURSE_STATISTICS_APPS_SCRIPT_MAX_ATTEMPTS || 2) || 2,
);
const APPS_SCRIPT_RETRY_DELAY_MS = Math.max(
  0,
  Number(process.env.COURSE_STATISTICS_APPS_SCRIPT_RETRY_DELAY_MS || 300) || 300,
);

const INVALID_REQUEST_MESSAGE = 'Invalid submission data.';
const SUBMIT_FAILURE_MESSAGE =
  'Course statistics could not be submitted right now. Please try again shortly.';
const INTEGRATION_NOT_READY_MESSAGE =
  'Course statistics submission is temporarily unavailable. Please contact the website administrator.';

function failureResponse(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

interface AppsScriptResponse {
  success?: boolean;
  ok?: boolean;
  message?: string;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  if (
    'cause' in error &&
    typeof (error as { cause?: unknown }).cause === 'object' &&
    (error as { cause: { code?: unknown } }).cause !== null &&
    typeof (error as { cause: { code?: unknown } }).cause.code === 'string'
  ) {
    return (error as { cause: { code: string } }).cause.code;
  }
  return null;
}

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'TimeoutError'
  );
}

function isRetryableUpstreamError(error: unknown): boolean {
  const code = getErrorCode(error);

  return (
    isTimeoutError(error) ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'EAI_AGAIN' ||
    code === 'ENETUNREACH' ||
    code === 'UND_ERR_CONNECT_TIMEOUT'
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return failureResponse('Invalid request body. Expected JSON payload.', 400);
  }

  const parsedPayload = courseStatisticsSubmissionPayloadSchema.safeParse(body);

  if (!parsedPayload.success) {
    return failureResponse(INVALID_REQUEST_MESSAGE, 400);
  }

  const normalizedRows = normalizeSubmissionRows(parsedPayload.data.rows);

  const hasMismatchedTotal = parsedPayload.data.rows.some((row, index) => {
    const normalizedRow = normalizedRows[index];
    return row.totalNumberOfStudents !== normalizedRow.totalNumberOfStudents;
  });

  if (hasMismatchedTotal) {
    return failureResponse(
      'Total Number of Students must equal Physics + Faculty + Other for every row.',
      400,
    );
  }

  const normalizedPayload = {
    coordinatorName: parsedPayload.data.coordinatorName,
    rows: normalizedRows,
  };

  const submittedAt = new Date().toISOString();
  const appsScriptPayload = toCourseStatisticsAppsScriptPayload(normalizedPayload, submittedAt);

  try {
    /**
     * Apps Script contract expectation:
     * 1. Find existing rows for this coordinator name.
     * 2. Remove or replace those existing rows.
     * 3. Insert the incoming rows as the fresh snapshot.
     * 4. Persist the submission timestamp ("Time and Date") for each written row.
     */
    let upstreamResponse: Response | null = null;
    let upstreamText = '';

    for (let attempt = 1; attempt <= APPS_SCRIPT_MAX_ATTEMPTS; attempt += 1) {
      try {
        upstreamResponse = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(appsScriptPayload),
          cache: 'no-store',
          signal: AbortSignal.timeout(APPS_SCRIPT_TIMEOUT_MS),
        });
        upstreamText = await upstreamResponse.text();
      } catch (error) {
        if (isRetryableUpstreamError(error) && attempt < APPS_SCRIPT_MAX_ATTEMPTS) {
          console.warn('Course statistics upstream request failed; retrying', {
            attempt,
            maxAttempts: APPS_SCRIPT_MAX_ATTEMPTS,
            code: getErrorCode(error),
            timeoutMs: APPS_SCRIPT_TIMEOUT_MS,
          });
          await delay(APPS_SCRIPT_RETRY_DELAY_MS);
          continue;
        }

        throw error;
      }

      if (
        upstreamResponse.status >= 500 &&
        attempt < APPS_SCRIPT_MAX_ATTEMPTS &&
        !upstreamText.includes('Script function not found: doPost')
      ) {
        console.warn('Course statistics upstream returned 5xx; retrying', {
          attempt,
          maxAttempts: APPS_SCRIPT_MAX_ATTEMPTS,
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText,
        });
        await delay(APPS_SCRIPT_RETRY_DELAY_MS);
        continue;
      }

      break;
    }

    if (!upstreamResponse) {
      return failureResponse(SUBMIT_FAILURE_MESSAGE, 502);
    }

    if (!upstreamResponse.ok) {
      console.error('Course statistics Apps Script HTTP failure', {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        bodyPreview: upstreamText.slice(0, 600),
      });

      return failureResponse(SUBMIT_FAILURE_MESSAGE, 502);
    }

    if (upstreamText.includes('Script function not found: doPost')) {
      console.error('Course statistics Apps Script missing doPost handler', {
        bodyPreview: upstreamText.slice(0, 600),
      });
      return failureResponse(INTEGRATION_NOT_READY_MESSAGE, 502);
    }

    let upstreamJson: AppsScriptResponse | null = null;

    try {
      upstreamJson = upstreamText ? (JSON.parse(upstreamText) as AppsScriptResponse) : null;
    } catch (error) {
      console.error('Course statistics Apps Script malformed JSON response', {
        bodyPreview: upstreamText.slice(0, 600),
        error,
      });
      return failureResponse(SUBMIT_FAILURE_MESSAGE, 502);
    }

    if (!upstreamJson || (upstreamJson.success !== true && upstreamJson.ok !== true)) {
      console.error('Course statistics Apps Script application failure', {
        response: upstreamJson,
      });
      return failureResponse(SUBMIT_FAILURE_MESSAGE, 502);
    }

    return NextResponse.json({
      success: true,
      message: 'Course statistics submitted successfully.',
    });
  } catch (error) {
    if (isTimeoutError(error)) {
      console.error('Course statistics submission timed out waiting for Apps Script response', {
        timeoutMs: APPS_SCRIPT_TIMEOUT_MS,
        maxAttempts: APPS_SCRIPT_MAX_ATTEMPTS,
      });
      return failureResponse(
        'We could not confirm submission in time. Please try again to receive a confirmed response.',
        504,
      );
    }

    if (isRetryableUpstreamError(error)) {
      console.error('Course statistics upstream connection failed after retries', {
        maxAttempts: APPS_SCRIPT_MAX_ATTEMPTS,
        timeoutMs: APPS_SCRIPT_TIMEOUT_MS,
        code: getErrorCode(error),
      });
      return failureResponse(SUBMIT_FAILURE_MESSAGE, 502);
    }

    console.error('Course statistics submission forwarding error', error);
    return failureResponse(SUBMIT_FAILURE_MESSAGE, 502);
  }
}
