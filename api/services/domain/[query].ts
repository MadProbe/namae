import { NowRequest, NowResponse } from '@vercel/node';
import fetch from 'cross-fetch';
import { send, sendError } from '../../../util/http';

export default async function handler(
  req: NowRequest,
  res: NowResponse
): Promise<void> {
  const { query } = req.query;
  console.log(query);

  if (!query || typeof query !== 'string') {
    return sendError(res, new Error('No query given'));
  }

  try {
    const response = await fetch(
      `https://domainr.p.rapidapi.com/v2/status?domain=${encodeURIComponent(
        query
      )}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.DOMAINR_API_KEY,
        },
      }
    ).then((res) => res.json());
    if (!response.status) {
      throw new Error('Internal Server Error');
    }
    const availability = response.status.map((stat) => ({
      query: stat.domain,
      availability: stat.summary === 'inactive',
    }));
    if (availability.length === 0) {
      return send(res, { availability: [] });
    }
    // NOTE: for backward compatibility
    send(res, {
      availability:
        response.status.length > 1
          ? availability
          : availability[0].availability,
    });
  } catch (err) {
    sendError(res, err);
  }
}
