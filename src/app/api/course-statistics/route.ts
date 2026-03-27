import { NextResponse } from 'next/server';
import { COURSE_STATISTICS_APPS_SCRIPT_URL } from '@/lib/course-statistics/config';
import {
  normalizeSubmissionRows,
  toCourseStatisticsAppsScriptPayload,
} from '@/lib/course-statistics/transform';
import { courseStatisticsSubmissionPayloadSchema } from '@/lib/course-statistics/validation';

const APPS_SCRIPT_URL =
  process.env.COURSE_STATISTICS_APPS_SCRIPT_URL?.trim() || COURSE_STATISTICS_APPS_SCRIPT_URL;

const INVALID_REQUEST_MESSAGE = 'Invalid submission data.';
const SUBMIT_FAILURE_MESSAGE =
  'Course statistics could not be submitted right now. Please try again shortly.';

function failureResponse(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

interface AppsScriptResponse {
  success?: boolean;
  ok?: boolean;
  message?: string;
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
    const upstreamResponse = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appsScriptPayload),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    const upstreamText = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      console.error('Course statistics Apps Script HTTP failure', {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        bodyPreview: upstreamText.slice(0, 600),
      });

      return failureResponse(SUBMIT_FAILURE_MESSAGE, 502);
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
    console.error('Course statistics submission forwarding error', error);
    return failureResponse(SUBMIT_FAILURE_MESSAGE, 502);
  }
}
