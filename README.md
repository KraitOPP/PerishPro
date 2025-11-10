## 🎯 Motive & Problem

Retail stores face a significant financial challenge: **product waste**, especially for perishable items like groceries, dairy, and meat. Billions of dollars are lost annually when these products expire before they can be sold.

Pricing these items is a constant battle:

  * Price too high, and the product doesn't sell before expiring.
  * Price too low, and potential profit is lost.

**PerishPro** solves this problem by providing store owners with a simple, powerful platform. It uses a machine learning model to analyze historical trends and product expiry dates to **recommend an optimal, dynamic price**, ensuring items sell *before* they expire while maximizing profitability.

## ✨ Key Features

  * **Dynamic Price Prediction:** Get real-time, AI-powered price recommendations for each perishable item.
  * **Smart Inventory Management:** A full CRUD (Create, Read, Update, Delete) interface to manage your store's inventory.
  * **Waste & Profit Analytics:** A visual dashboard with charts to track waste reduction, profit margins, and sales trends.
  * **User Authentication:** Secure user registration and login system using JWT (JSON Web Tokens).
  * **Cloud Media Uploads:** Product images are handled and served via [Cloudinary](https://cloudinary.com/).

## ⚙️ How It Works: System Architecture

PerishPro is built with a modern, decoupled **microservice architecture**. This makes the application scalable, maintainable, and robust.

1.  **Frontend (React + TypeScript):** A dynamic, responsive user interface built with Vite. It's what the store owner sees and interacts with. It handles all UI, state management, and makes API calls.

2.  **Backend (Node.js + Express):** The central API server. It manages user authentication, stores all product and inventory data in MongoDB, and handles business logic.

3.  **Model Server (Python + Flask):** A dedicated microservice that hosts the trained machine learning model. The Backend API communicates with this server to get price predictions, which are then relayed to the frontend.

## 🛠️ Tech Stack

| Area | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (with TypeScript) | Building the user interface |
| | Vite | Frontend tooling and development server |
| | Tailwind CSS | Utility-first CSS framework for styling |
| | Zustand | Lightweight global state management (for user auth) |
| | React Router | Client-side routing for pages |
| | Axios | Making HTTP requests to the backend |
| **Backend** | Node.js / Express.js | Building the REST API server |
| | MongoDB (with Mongoose) | NoSQL database for storing product & user data |
| | JSON Web Tokens (JWT) | Secure user authentication |
| | Cloudinary | Cloud-based image hosting and management |
| **Model** | Python / Flask | Serving the ML model as a simple API |
| | Scikit-learn / Joblib | Running the pre-trained prediction models |

## 📁 Project Structure

```
PerishPro/
├── Backend/              # Node.js, Express, MongoDB API
│   ├── Controllers/
│   ├── Middlewares/
│   ├── Models/
│   ├── Routes/
│   ├── connection.js
│   ├── index.js
│   └── package.json
│
├── Frontend/             # React, TypeScript, Vite App
│   ├── public/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main page components
│   │   ├── services/     # API call functions (authService, productService)
│   │   ├── store/        # Zustand global state (authStore)
│   │   ├── App.tsx       # Main router
│   │   └── main.tsx      # Entry point
│   └── package.json
│
└── Model/                # Python, Flask ML API
    ├── app.py            # Flask server
    ├── demand_model.joblib  # The trained ML model
    └── requirements.txt
```

-----

## 🚀 How to Setup and Run

To run this project, you need to have **three separate terminals** open, one for each part of the application.

### Prerequisites

  * [Node.js](https://nodejs.org/en/) (v18 or newer)
  * [Python](https://www.python.org/downloads/) (v3.9 or newer)
  * [MongoDB](https://www.mongodb.com/try/download/community) (or a free MongoDB Atlas cloud instance)

-----

### Terminal 1: Run the Backend (Node.js)

1.  **Navigate to the Backend:**

    ```bash
    cd Backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env` in the `Backend` folder. Copy the contents of `.env.example` into it and fill in your details.

    **`Backend/.env`**

    ```env
    PORT=
    ML_API_URL=
    MONGODB_URL=
    JWT_KEY=
    NODE_ENV=
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
    ```

4.  **Start the server:**

    ```bash
    npm start
    ```

    *This will run on `http://localhost:5000` (or your specified `PORT`)*

-----

### Terminal 2: Run the ML Model Server (Python)

1.  **Navigate to the Model folder:**

    ```bash
    cd Model
    ```

2.  **Create a virtual environment (Recommended):**

    ```bash
    # Mac/Linux
    python3 -m venv venv
    source venv/bin/activate

    # Windows
    python -m venv venv
    venv\Scripts\activate
    ```

3.  **Install Python dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Start the ML server:**

    ```bash
    python app.py
    ```

    *This will run on `http://localhost:5001` (by default, check `app.py`)*

-----

### Terminal 3: Run the Frontend (React)

1.  **Navigate to the Frontend:**

    ```bash
    cd Frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env` in the `Frontend` folder. This tells the React app where to find your other servers.

    **`Frontend/.env`**

    ```env
    VITE_API_BASE_URL=http://localhost:5000/api
    ```

4.  **Start the development server:**

    ```bash
    npm run dev
    ```

    *This will open the app in your browser at `http://localhost:5173` (or a similar port)*

You can now register a new user and start using PerishPro\!
