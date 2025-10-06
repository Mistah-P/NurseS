<template>
  <div class="d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow border" style="width: 400px; border-color: #33374C;">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="card-title mb-0 fw-semibold">Create an Account</h5>
          <!-- Close back to home (NotLoggedIn) -->
          <router-link to="/" class="btn-close" aria-label="Close"></router-link>
        </div>

        <form @submit.prevent="handleRegister">
          <div class="mb-3">
            <label for="name" class="form-label text-uppercase small">Full Name</label>
            <input
              type="text"
              id="name"
              class="form-control custom-input"
              v-model="name"
              placeholder="Juan Dela Cruz"
              required
              autocomplete="name"
            />
          </div>

          <div class="mb-3">
            <label for="email" class="form-label text-uppercase small">Email Address</label>
            <input
              type="email"
              id="email"
              class="form-control custom-input"
              v-model="email"
              placeholder="name@email.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="mb-4">
            <label for="password" class="form-label text-uppercase small">Password</label>

            <!-- Password with show/hide toggle -->
            <div class="position-relative has-toggle">
              <input
                :type="passwordVisible ? 'text' : 'password'"
                id="password"
                class="form-control custom-input"
                v-model="password"
                placeholder="Password"
                required
                autocomplete="new-password"
                @keyup.enter="handleRegister"
              />

              <button
                type="button"
                class="toggle-password"
                :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
                :title="passwordVisible ? 'Hide password' : 'Show password'"
                @click="passwordVisible = !passwordVisible"
              >
                <!-- Eye (show) -->
                <svg v-if="!passwordVisible" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>

                <!-- Eye off (hide) -->
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 3l18 18M10.585 10.585A3 3 0 0012 15a3 3 0 002.121-.879M9.88 9.88A3 3 0 0115 12m-3-7c4.477 0 8.268 2.943 9.542 7a10.056 10.056 0 01-4.478 5.21M6.223 6.223A9.963 9.963 0 0012 5c.686 0 1.354.07 2 .204M4.458 7A10.05 10.05 0 002 12c1.274 4.057 5.065 7 9.542 7 1.18 0 2.316-.18 3.375-.51"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn w-100 custom-btn">Register</button>
        </form>

        <p class="text-center mt-4 mb-0 text-muted small">
          Already have an account?
          <!-- Redirect explicitly to LoginForm.vue -->
          <router-link :to="{ name: 'LoginForm' }" class="text-decoration-none">Log In</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from "../firebase/init"; // Firebase Authentication
import { db } from "../firebase/init"; // Firestore
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Firestore methods

export default {
  name: 'RegisterForm',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      passwordVisible: false,
    }
  },
  methods: {
    async handleRegister() {
      try {
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;

        // Save user data to Firestore
        await setDoc(doc(db, "users", user.uid), {
          name: this.name,
          email: this.email,
          createdAt: new Date()
        });

        console.log("User registered and saved to Firestore:", user.uid);
        this.$router.push({ name: 'LoggedIn' }); // Redirect to the logged-in page
      } catch (error) {
        alert("Registration failed: " + error.message);
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

.card {
  border-width: 2px !important;
}

.custom-input {
  background-color: #CCCEDA;
  border: 1px solid #ccc;
  font-family: 'DM Sans', sans-serif;
  color: #111; /* ensure good contrast on the gray background */
}

/* Make room for the eye button */
.has-toggle .custom-input {
  padding-right: 2.5rem;
}

.toggle-password {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  padding: 0;
  display: grid;
  place-items: center;
  cursor: pointer;
  color: #333;           /* svg uses currentColor */
  border-radius: 50%;
}

.toggle-password:hover {
  background: rgba(0,0,0,0.05);
}

.toggle-password:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(45, 83, 158, 0.25);
}

.toggle-password svg {
  width: 20px;
  height: 20px;
}

.custom-btn {
  background-color: #2D539E;
  color: white;
  font-family: 'DM Sans', sans-serif;
}

.custom-btn:hover {
  background-color: #2D539E;
}
</style>
