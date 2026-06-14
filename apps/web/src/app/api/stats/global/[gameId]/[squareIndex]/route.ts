import DataService from "@/services/data.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string; squareIndex: string }> },
): Promise<Response> {
  try {
    const { gameId, squareIndex } = await params;
    const result = await DataService.getGlobalCardPicks(parseInt(gameId), parseInt(squareIndex));
    return new Response(JSON.stringify(result), {
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
