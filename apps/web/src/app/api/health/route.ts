import DataService from "@/services/data.service";

export async function GET(): Promise<Response> {
  try {
    const game = await DataService.getTodaysGame();
    if (game === undefined) {
      return new Response(JSON.stringify({ status: "no puzzle" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ status: "error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
