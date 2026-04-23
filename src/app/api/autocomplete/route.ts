import AutocompleteService from "@/services/autocomplete.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

AutocompleteService.prime();

export async function GET(request: Request): Promise<Response> {
  try {
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const options = await AutocompleteService.getSuggestions(query);

    return new Response(JSON.stringify({ options }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Error retrieving autocomplete suggestions:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  }
}
