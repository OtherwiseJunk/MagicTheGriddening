import DataService from "@/services/data.service";

interface SessionRequest {
  playerId?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SessionRequest;
    if (!body.playerId) {
      return new Response(JSON.stringify({ error: "playerId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { shortCode } = await DataService.findOrCreatePlayer(body.playerId);
    return new Response(JSON.stringify({ shortCode }), {
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
