E-commerce Project Documentation

Overview of the Project

This project is a feature-rich e-commerce platform designed to provide users with a seamless online shopping experience. The platform allows customers to browse products, add items to their cart, and place orders efficiently. Additionally, it includes a robust admin dashboard for managing products, orders, and user data. The project is built with scalability and performance in mind, ensuring a smooth and intuitive interface for both users and administrators.


Objectives:

 Provide an intuitive interface for users to explore and purchase products.
 Simplify order management and inventory tracking for admins.
 Offer secure authentication and payment methods.

Project URLs
 Frontend (Customer-Facing Store): https://ecommerce-frontend-two-alpha.vercel.app/login
 Admin Dashboard: https://ecommerce-admin-rose-xi.vercel.app/add

Setup Instructions
Prerequisites:

Node.js (v16 or later)
 npm or yarn

MongoDB (for database)
 Backend URL (Ensure your backend server is running and accessible)

Steps to Run the Application:
Clone the Repository:

git clone <repository-url>
cd ecommerce-project

Install Dependencies:
# For the frontend:
cd frontend
npm install

# For the backend:
cd backend
npm install

Set Up Environment Variables:
In the backend folder, create a .env file with the following:

MONGODB_URI=mongodb+srv://aryan:92301703040@cluster0.df68i.mongodb.net
ADMIN_EMAIL=aryan32@gmail.com
ADMIN_PASSWORD=aryan123

In the frontend folder, create a .env file with:

VITE_BACKEND_URL=http://localhost:5000

Run the Backend:

cd backend
npm start

Run the Frontend:

cd frontend
npm run dev


