from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Backend is running!"}

if __name__ == "__main__":
    # Attempt to run on the same port 8000 to check for conflicts
    uvicorn.run(app, host="127.0.0.1", port=8000)
