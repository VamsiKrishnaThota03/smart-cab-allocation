// import React, { useEffect, useState } from 'react';
// import Navbar from './Navbar'; // Import the Navbar component
// import './UserDetails.css'; // Assuming you want to apply some custom styles

// const UserDetails = () => {
//   const [credentials, setCredentials] = useState({ email: "", name: "" });

//   useEffect(() => {
//     const fetchUserDetails = async () => {
//       try {
//         const response = await fetch("http://localhost:5000/api/auth/getuser", {
//           method: 'POST',
//           headers: { "auth-token": localStorage.getItem('auth-token') },
//         });
//         const userDetails = await response.json();
//         setCredentials({ email: userDetails.email, name: userDetails.name });
//       } catch (error) {
//         console.error("Error fetching user details:", error);
//       }
//     };

//     fetchUserDetails();
//   }, []);

//   return (
//     <>
//       {/* Navbar will still be shown on this page */}
//       <Navbar hideProfileButton={true} />

//       <div className="profile-page">
//         <div className="profile-card card">
//           <div className="card-body">
//             <h2 className="card-title">Your Profile</h2>
//             <p className="card-text">
//               <strong>Email: </strong> {credentials.email}
//             </p>
//             <p className="card-text">
//               <strong>Name: </strong> {credentials.name}
//             </p>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default UserDetails;

import React, { useEffect, useState } from "react";
import Navbar from "./Navbar"; // Import the regular Navbar component
import AdminNavbar from "./AdminNavbar"; // Import the admin-specific Navbar
import "./UserDetails.css"; // Import custom styles

const UserDetails = () => {
  const [credentials, setCredentials] = useState({ email: "", name: "" });
  const isAdmin = localStorage.getItem("isAdmin") === "true"; // Retrieve admin status

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/auth/getuser", {
          method: "POST",
          headers: { "auth-token": localStorage.getItem("auth-token") },
        });
        const userDetails = await response.json();
        setCredentials({ email: userDetails.email, name: userDetails.name });
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, []);

  return (
    <>
      {/* Conditionally render either the regular or admin Navbar */}
      {isAdmin ? (
        <AdminNavbar hideProfileButton={true} />
      ) : (
        <Navbar hideProfileButton={true} />
      )}

      <div className="profile-page">
        <div className="profile-card card">
          <div className="card-body">
            <h2 className="card-title">Your Profile</h2>
            <p className="card-text">
              <strong>Email: </strong> {credentials.email}
            </p>
            <p className="card-text">
              <strong>Name: </strong> {credentials.name}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetails;
