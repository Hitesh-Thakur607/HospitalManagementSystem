<<<<<<< HEAD
# Hospital Management System

A web-based Hospital Management System built using Node.js, Express, MySQL, and EJS templates.

## Getting Started

1. **Clone or Download the Project**

   First, clone or download the project to your local machine.

2. **Navigate to the project directory:**

   cd hospital-management

3. **Install Dependencies**

   Open a command prompt in the project folder and run:

   ```bash
   cd hospital-management
   npm install

   ```

4. **Configure Database Connection**

   Configure your MySQL database connection settings in the db_controller.js file inside the models directory

5. **Configure Email Settings**

   _javascript_

   Set up your own email configuration for sending verification emails in the signup process. Modify the following code in your signup controller (signup_controller.js or similar)
   const transporter = nodemailer.createTransport({
   host: "smtp.ethereal.email",
   port: 587,
   auth: {
   user: "your_email@your_domain.com", // Update with your email and password
   pass: "your_password",
   },
   });

6. **Import the Database**

   Import the provided database file into your MySQL server.

7. **Start the Application**

   Start the application using the following command:

   node app.js

8. **Access the Application**

   SAccess the application in your web browser at http://localhost:3000.

## Technologies Used

- **Node.js**: A JavaScript runtime environment for building server-side applications.
- **Express**: A web application framework for Node.js, used for routing and handling HTTP requests.
- **MySQL**: A relational database management system for storing and managing hospital data.
- **EJS (Embedded JavaScript)**: A template engine for rendering dynamic web pages.

## Installations

To run this project, you need to have Node.js and MySQL installed on your system. You also need to create a database named nodelogin and import the nodelogin.sql file into it. Then, you need to install the dependencies by running npm install in your project directory. Finally, you can start the server by running node app.js and access the application at http://localhost:3000.

## Project Structure

The project is organized into the following directories:

- **controllers**: Contains server-side logic for different functionalities.
- **models**: Includes database-related code, such as connection and data models.
- **css**: CSS styles for styling the web pages.
- **fonts**: Font files used for the project.
- **img**: Images and icons used in the project.
- **js**: Client-side JavaScript files.
- **scripts**: Server-side scripts for various tasks.
- **styles**: CSS stylesheets for the project.
- **syntax-highlighter**: Code highlighting scripts or styles (if used).
- **index.html**: The main HTML file for your project.

The project has a landing page that allows users to sign up or log in. After signing up, users need to verify their email address by clicking on the link sent to their email. Users can then log in with their email and password and access the home page. The home page has a navigation bar that allows users to access different features of the application, such as:

- **Add Doctor**: Users can add a new doctor to the database by providing their name, specialization, email, phone number, and password.

- **Appointment**: Users can book an appointment with a doctor by selecting a date and time slot. They can also view their upcoming and past appointments.

- **Chat**: Users can chat with a doctor online by sending and receiving messages. They can also view their chat history with different doctors.

- **Complain**: Users can file a complaint against a doctor or an employee by providing their name, email, phone number, and complaint details.

- **Employee**: Users can add a new employee to the database by providing their name, email, phone number, and password. They can also view the list of existing employees.

- **Home**: Users can view their profile information and edit their name, email, phone number, or password.

- **Inbox**: Users can view the emails they have received from the application, such as verification emails, appointment confirmation emails, etc.

- **Landing**: Users can return to the landing page and log out of the application.

- **Login**: Users can log in to the application with their email and password.

- **Logout**: Users can log out of the application and return to the landing page.

- **Receipt**: Users can generate a receipt for their payment by providing their name, email, phone number, amount paid, and payment method. They can also view their previous receipts.

- **Reset Password**: Users can reset their password by entering their email address and clicking on the link sent to their email. They can then enter a new password and confirm it.

- **Set Password**: Users can set a new password for their account by entering their current password and a new password. They can then confirm it and save it.

# Folder Structure

The project has the following folder structure:

- **controllers**: This folder contains the files that handle the logic and functionality of your application. Each file corresponds to a specific feature or route, such as adding a doctor, booking an appointment, chatting with a doctor, etc.

  - add_doctor.js
  - appointment.js
  - chat.js
  - complain.js
  - doc_controller.js
  - employee.js
  - home.js
  - inbox.js
  - landing.js
  - login.js
  - logout.js
  - receipt.js
  - reset_controller.js
  - set_controller.js
  - signup.js
  - store.js
  - validator.js
  - verify.js

- **models**: This folder contains the file that connects to your MySQL database and performs queries and operations on your data.

  - db_controller.js

- **app.js**: This file is the entry point of your application. It sets up the Express server, the middleware, and the routes.

- **nodelogin.sql**: This file contains the SQL commands to create and populate your database tables.

- **182 Medico -DOC**: This folder contains the files that define the front-end of your application. It includes HTML, CSS, JavaScript, fonts, images, and other resources.

  - css
  - fonts
  - img
  - js
  - syntax-highlighter
  - scripts
  - styles
  - index.html
=======
# Hospital-Management
A hospital management system using nodejs , express , mysql , ejS

First clone or Download the project

Next open command prompt in project folder 

Then type npm install (or you can use command npm update)
import the database file in mysql server
After that type nodemon app (or you can use node app) 

Home
![](screenshot/home.PNG)

Sign Up

![](screenshot/signup.PNG)

Dash Board
![](screenshot/dash.PNG)

Medicine Store

![](screenshot/med.PNG)

Report Generate
![](screenshot/report.PNG)

Add Employee Leave
![](screenshot/leave.PNG)
# HMS
>>>>>>> 07340e6 (first commit)
