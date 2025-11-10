from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from model import make_prediction

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the input data structure
class UserInput(BaseModel):
    Age: int
    City_Tier: str
    Dependents: int
    Desired_Savings: float
    Desired_Savings_Percentage: float
    Disposable_Income: float
    Eating_Out: float
    Education: float
    Entertainment: float
    Groceries: float
    Healthcare: float
    Income: float
    Insurance: float
    Loan_Repayment: float
    Miscellaneous: float
    Occupation: str
    Rent: float
    Transport: float
    Utilities: float

@app.post("/predict")
async def predict(user_input: UserInput):
    try:
        # Convert incoming data into dictionary and pass to prediction function
        input_data = user_input.dict()
        
        # Log input for debugging
        print(f"=== FASTAPI PREDICTION REQUEST ===")
        print(f"Input data: {input_data}")
        
        prediction = make_prediction(input_data)
        
        print(f"Prediction result: {prediction}")
        return {"predictions": prediction}
    except Exception as e:
        print(f"Error during prediction: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
