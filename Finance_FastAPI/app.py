from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import make_prediction

app = FastAPI()

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
        prediction = make_prediction(input_data)
        return {"predictions": prediction}
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
