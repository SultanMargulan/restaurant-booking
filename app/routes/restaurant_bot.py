# app/routes/restaurant_bot.py
from flask import Blueprint, Response, request, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv
from app.extensions import db, limiter, csrf         # NEW  ← csrf arrives here
from app.models import Restaurant, MenuItem, Layout
import os, json, openai, datetime as dt

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

restaurant_bot_bp = Blueprint(
    "restaurant_bot",
    __name__,
    url_prefix="/api/restaurant-bot"
)

# === CORS & CSRF ============================================================
CORS(
    restaurant_bot_bp,
    origins=["http://localhost:3000"],
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"]
)
csrf.exempt(restaurant_bot_bp)                       # NEW  ← no CSRF for this BP
# ===========================================================================

SYSTEM_BASE = (
    "You are TableMate-AI, an assistant that helps users pick restaurants, "
    "tables and menu items. Be concise, friendly and data-driven."
)

# --- optional OpenAI function declarations trimmed for brevity -------------
FUNCTIONS = [
    {
        "name": "get_restaurant_info",
        "description": "Look up a restaurant, table layout and menu",
        "parameters": {
            "type": "object",
            "properties": {"name": {"type": "string"}},
            "required": ["name"],
        },
    }
]

# --------------------------- ROUTES ----------------------------------------

@restaurant_bot_bp.route("", methods=["GET"])        # NEW  ← silences 404 spam
def health():
    return {"status": "ok"}, 200


@restaurant_bot_bp.route("", methods=["POST", "OPTIONS"])
@limiter.limit("5/second")
def chat_stream():
    if request.method == "OPTIONS":
        # Let the browser know it’s OK to post
        response = Response("", status=200)
        response.headers.update(
            {
                "Access-Control-Allow-Origin": "http://localhost:3000",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Credentials": "true",
            }
        )
        return response

    # ---------------- main logic ----------------
    messages = request.json.get("messages", [])
    msg_chain = [{"role": "system", "content": SYSTEM_BASE}] + [
        m for m in messages if m["role"] != "system"
    ]

    def stream():
        resp = openai.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",
            messages=msg_chain,
            functions=FUNCTIONS,
            stream=True,
            temperature=0.4,
            max_tokens=800,
        )

        fn_args = ""
        for chunk in resp:
            delta = chunk.choices[0].delta

            # function-call chunks arrive here -------------------------------
            if delta.function_call:
                fn_args += delta.function_call.arguments or ""
                continue

            if fn_args:
                # execute resolved function call once it’s complete
                try:
                    args = json.loads(fn_args)
                    result = get_restaurant_info(**args)
                    msg_chain.append(
                        {
                            "role": "function",
                            "name": "get_restaurant_info",
                            "content": json.dumps(result),
                        }
                    )
                    # re-query the model with fresh info
                    inner = openai.chat.completions.create(
                        model="gpt-4o-mini-2024-07-18",
                        messages=msg_chain,
                        stream=True,
                        temperature=0.4,
                        max_tokens=800,
                    )
                    for c in inner:
                        yield f"data:{c.choices[0].delta.content or ''}\n\n"
                    return
                except Exception as e:
                    yield f"data:Sorry, I hit an error: {e}\n\n"
                    return

            # plain text chunk
            yield f"data:{delta.content or ''}\n\n"

    return Response(stream_with_context(stream()), mimetype="text/event-stream")
