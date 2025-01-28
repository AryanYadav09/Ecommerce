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
CLOUDINARY_API_KEY=242679548474778
CLOUDINARY_SECRET_KEY=McPc4rrjvwxmYOcAxD6Z3phhE0E
CLOUDINARY_NAME=dwbysqaoe
JWT_SECRET=Ecommerce
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


Key Features
	Customer Frontend
		Product Listing & Filters: Users can browse products and apply filters by category, size, and price.
		Search Functionality: A responsive search bar for finding products easily.
		Cart Management: Add, update, and remove items from the cart with real-time price updates.
		Checkout: Place orders with delivery address and payment methods (e.g., Cash on Delivery).
		Order Tracking: Customers can view and track their orders.
Admin Dashboard
		Product Management: Add, edit, and delete products, including attributes like name, price, images, and stock.
		Order Management: View all orders placed, with details of items, quantities, and customer addresses.
		User Management: Monitor registered users and their activities.
		Analytics: View key metrics like sales performance and inventory status.
Tech Stack
		Frontend
		React.js with React Router
		Tailwind CSS for styling
		Axios for API requests
		Vite as the build tool
Backend
		Node.js with Express.js
		MongoDB (NoSQL Database)
		Cloudinary (Media storage)
		JWT (Authentication)
Admin Dashboard
		React.js with React Router
		Tailwind CSS for styling
		Axios for API communication
Others
		Vercel (Frontend and Admin Dashboard hosting)
		Toastify (User notifications)
		Git (Version control)

