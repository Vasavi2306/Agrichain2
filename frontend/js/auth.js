
// =========================
// REGISTRATION
// =========================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const role = document.getElementById("role").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (role === "") {
            alert("Please select your role.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        role,
                        password
                    })
                }
            );

            const data = await response.json();

            console.log("Registration Response:", data);

            if (response.ok) {
                alert(data.message || "Registration successful!");
                registerForm.reset();
            } else {
                alert(data.message || "Registration failed.");
            }

        } catch (error) {
            console.error("Registration Error:", error);
            alert("Unable to connect to the server.");
        }
    });
}


// =========================
// LOGIN FARMER / BUYER / ADMIN
// =========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const role = document.getElementById("loginRole").value;

        // Check role
        if (role === "") {
            alert("Please select your role.");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        role
                    })
                }
            );

            const data = await response.json();

            console.log("Login Response:", data);

            if (!response.ok) {
                alert(data.message || "Login failed.");
                return;
            }

            // Save token and user information
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            alert(data.message || "Login successful!");

            // Redirect according to role
            if (data.user.role === "farmer") {
                window.location.href = "farmer.html";
            } else if (data.user.role === "buyer") {
                window.location.href = "buyer.html";
            } else if (data.user.role === "admin") {
                window.location.href = "admin.html";
            } else {
                alert("Unknown user role.");
            }

        } catch (error) {
            console.error("Login Error:", error);
            alert("Unable to connect to the server. Please check if the backend is running.");
        }
    });
}
