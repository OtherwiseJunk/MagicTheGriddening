import DataService from "@/services/data.service";

interface RestoreRequest {
  shortCode?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as RestoreRequest;
    if (!body.shortCode) {
      return new Response(JSON.stringify({ error: "shortCode required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const result = await DataService.findPlayerByShortCode(body.shortCode);
    if (!result) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ playerId: result.playerId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
