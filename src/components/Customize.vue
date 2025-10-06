<template> 
  <div class="app-container"> 
    <!-- Top Bar (DO NOT CHANGE) --> 
    <header class="top-bar"> 
      <div class="left-section"> 
        <span class="logo" @click="goToLoggedIn">NurseScripts</span> 
      </div> 
      <div class="right-section"> 
        <span class="username" @click="goToUserPage">{{ username }}</span> 
        <div class="progress-circle"> 
          <span class="progress-number">5</span> 
        </div> 
        <img src="@/assets/settings.png" alt="Settings" class="icon-img" @click="goToSettings" /> 
        <img src="@/assets/highscore.png" alt="Highscore" class="icon-img" @click="goToHighscore" /> 
        <img src="@/assets/about.png" alt="About" class="icon-img" @click="goToAbout" /> 
      </div> 
    </header> 

    <!-- Customize Content --> 
    <div class="customize-shell"> 
      <!-- Close Button --> 
      <button class="close-btn" @click="goBack">×</button> 

      <!-- Keys to include --> 
      <section class="group"> 
        <div class="group-title">keys to include</div> 
        <div class="group-row"> 
          <button 
            class="pill" 
            :class="{ active: keys.numbers }" 
            :disabled="disableKeys" 
            @click="toggleKey('numbers')" 
          >Numbers</button> 
          <button 
            class="pill" 
            :class="{ active: keys.punctuation }" 
            :disabled="disableKeys" 
            @click="toggleKey('punctuation')" 
          >Punctuation</button> 
        </div> 
      </section> 

      <!-- Mode --> 
      <section class="group"> 
        <div class="group-title">Mode</div> 
        <div class="group-row wrap"> 
          <button class="pill" :class="{ active: mode === 'words' }" @click="selectMode('words')">Words</button> 
          <button class="pill" :class="{ active: mode === 'time' }" @click="selectMode('time')">Time</button> 

          <!-- Clinical scenarios --> 
          <div class="dropdown-wrapper"> 
            <button 
              class="pill with-caret" 
              :class="{ active: mode === 'clinical' }" 
              @click="toggleDropdown('clinical')" 
            > 
              {{ selectedClinical ? selectedClinical : 'Clinical scenarios' }} 
              <span class="caret">▾</span> 
            </button> 
            <div v-if="showClinical" class="dropdown" @mouseleave="showClinical = false"> 
              <div 
                v-for="opt in clinicalOptions" 
                :key="opt" 
                class="dropdown-item" 
                :class="{ selected: selectedClinical === opt }" 
                @click="selectClinical(opt)" 
              >{{ opt }}</div> 
            </div> 
          </div> 

          <!-- Body system --> 
          <div class="dropdown-wrapper"> 
            <button class="pill with-caret" :class="{ active: mode === 'body' }" @click="toggleDropdown('body')"> 
              {{ selectedBody ? selectedBody : 'Body-system' }} 
              <span class="caret">▾</span> 
            </button> 
            <div v-if="showBody" class="dropdown" @mouseleave="showBody = false"> 
              <div 
                v-for="opt in bodySystemOptions" 
                :key="opt" 
                class="dropdown-item" 
                :class="{ selected: selectedBody === opt }" 
                @click="selectBody(opt)" 
              >{{ opt }}</div> 
            </div> 
          </div> 

          <!-- Documentation --> 
          <div class="dropdown-wrapper"> 
            <button class="pill with-caret" :class="{ active: mode === 'documentation' }" @click="toggleDropdown('documentation')"> 
              {{ selectedDocumentation ? selectedDocumentation : 'Documentation' }} 
              <span class="caret">▾</span> 
            </button> 
            <div v-if="showDocumentation" class="dropdown" @mouseleave="showDocumentation = false"> 
              <div 
                v-for="opt in documentationOptions" 
                :key="opt" 
                class="dropdown-item" 
                :class="{ selected: selectedDocumentation === opt }" 
                @click="selectDocumentation(opt)" 
              >{{ opt }}</div> 
            </div> 
          </div> 
        </div> 
      </section> 

      <!-- number of words --> 
      <section class="group"> 
        <div class="group-title">number of words</div> 
        <div class="group-row wrap"> 
          <button class="pill" :class="{ active: wordsSelection === 15 }" :disabled="disableWordsGroup" @click="selectWords(15)">15</button> 
          <button class="pill" :class="{ active: wordsSelection === 30 }" :disabled="disableWordsGroup" @click="selectWords(30)">30</button> 
          <button class="pill" :class="{ active: wordsSelection === 60 }" :disabled="disableWordsGroup" @click="selectWords(60)">60</button> 

          <!-- Custom words input --> 
          <div class="custom-time-wrapper"> 
            <button class="pill" :class="{ active: wordsSelection === 'custom' }" :disabled="disableWordsGroup" @click="toggleWordsCustom">custom</button> 
            <input 
              v-if="showWordsCustom" 
              type="number" 
              class="custom-input" 
              v-model.number="wordsCustom" 
              placeholder=" " 
              min="61" 
              :disabled="disableWordsGroup" 
            /> 
          </div> 
        </div> 
      </section> 

      <!-- time duration --> 
      <section class="group"> 
        <div class="group-title">time duration</div> 
        <div class="group-row wrap"> 
          <button class="pill" :class="{ active: timeSelection === 15 }" :disabled="disableTimeGroup" @click="selectTime(15)">15</button> 
          <button class="pill" :class="{ active: timeSelection === 30 }" :disabled="disableTimeGroup" @click="selectTime(30)">30</button> 
          <button class="pill" :class="{ active: timeSelection === 60 }" :disabled="disableTimeGroup" @click="selectTime(60)">60</button> 

          <!-- Custom time input --> 
          <div class="custom-time-wrapper"> 
            <button class="pill" :class="{ active: timeSelection === 'custom' }" :disabled="disableTimeGroup" @click="toggleTimeCustom">custom</button> 
            <input 
              v-if="showTimeCustom" 
              type="number" 
              class="custom-input" 
              v-model.number="timeCustom" 
              placeholder=" " 
              min="2" 
              :disabled="disableTimeGroup" 
            /> 
          </div> 
        </div> 
      </section> 

      <!-- Error Message --> 
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p> 

      <!-- Footer actions --> 
      <div class="footer-actions"> 
        <button class="secondary-btn" @click="resetAll">Reset</button> 
        <button class="primary-btn" :disabled="!isFormValid" @click="done">Done</button> 
      </div> 
    </div> 
  </div> 
</template> 

<script>
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default {
  name: "CustomizePage",
  data() {
    return {
      username: "",

      keys: { numbers: false, punctuation: false },

      // mode can be: 'words' | 'time' | 'clinical' | 'body' | 'documentation' | null
      mode: null,

      clinicalOptions: ["Diagnosis", "Doctor’s Prescription", "Patient Interview"],
      bodySystemOptions: ["Nervous System", "Circulatory System", "Respiratory System"],
      documentationOptions: ["Nursing Notes", "Discharge Instructions"],

      selectedClinical: null,
      selectedBody: null,
      selectedDocumentation: null,

      showClinical: false,
      showBody: false,
      showDocumentation: false,

      // words group: 15 | 30 | 60 | 'custom' | null
      wordsSelection: null,
      wordsCustom: "",
      showWordsCustom: false,

      // time group: 15 | 30 | 60 | 'custom' | null
      timeSelection: null,
      timeCustom: "",
      showTimeCustom: false,

      errorMessage: "",
    };
  },

  computed: {
    disableKeys() { return false; },
    disableWordsGroup() { return this.mode !== "words"; },
    disableTimeGroup() { return this.mode !== "time"; },

    isWordsCustomValid() {
      return typeof this.wordsCustom === "number" && !isNaN(this.wordsCustom) && this.wordsCustom >= 61;
    },
    isTimeCustomValid() {
      return typeof this.timeCustom === "number" && !isNaN(this.timeCustom) && this.timeCustom >= 2;
    },

    isFormValid() {
      switch (this.mode) {
        case "words":
          if ([15, 30, 60].includes(this.wordsSelection)) return true;
          if (this.wordsSelection === "custom") return this.isWordsCustomValid;
          return false;
        case "time":
          if ([15, 30, 60].includes(this.timeSelection)) return true;
          if (this.timeSelection === "custom") return this.isTimeCustomValid;
          return false;
        case "clinical":
          return !!this.selectedClinical;
        case "body":
          return !!this.selectedBody;
        case "documentation":
          return !!this.selectedDocumentation;
        default:
          return false;
      }
    },
  },

  watch: {
    wordsCustom() { this.validateWords(); },
    timeCustom() { this.validateTime(); },
  },

  methods: {
    async fetchUsername() {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const db = getFirestore();
        const userDoc = doc(db, "users", user.uid);
        try {
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            this.username = docSnap.data().name || "";
          } else {
            console.error("No such document!");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        console.error("No user is logged in.");
      }
    },

    // ---------- Navigation (Top bar / close) ----------
    goBack() { if (window.history.length > 1) this.$router.back(); else this.$router.push("/loggedin"); },
    goToSettings() { this.$router.push("/settings"); },
    goToHighscore() { this.$router.push("/highscore"); },
    goToAbout() { this.$router.push("/aboutns"); },
    goToLoggedIn() { this.$router.push("/loggedin"); },
    goToUserPage() { this.$router.push("/user"); },

    // ---------- Toggles & selects ----------
    toggleKey(k) { this.keys[k] = !this.keys[k]; },

    selectMode(m) {
      if (this.mode === m) return;
      this.mode = m;

      // Close dropdowns
      this.showClinical = false; this.showBody = false; this.showDocumentation = false;

      // Reset groups based on mode
      if (m === "words") {
        this.timeSelection = null; this.timeCustom = ""; this.showTimeCustom = false;
      } else if (m === "time") {
        this.wordsSelection = null; this.wordsCustom = ""; this.showWordsCustom = false;
      } else {
        // scenario modes: clear both numeric groups
        this.wordsSelection = null; this.wordsCustom = ""; this.showWordsCustom = false;
        this.timeSelection = null; this.timeCustom = ""; this.showTimeCustom = false;
      }

      this.errorMessage = "";
      this.validateWords(true);
      this.validateTime(true);
    },

    toggleDropdown(which) {
      this.showClinical = which === "clinical" ? !this.showClinical : false;
      this.showBody = which === "body" ? !this.showBody : false;
      this.showDocumentation = which === "documentation" ? !this.showDocumentation : false;

      // Set mode through the same flow so resets happen consistently
      this.selectMode(which);
    },

    selectClinical(opt) { this.selectedClinical = opt; this.mode = "clinical"; this.showClinical = false; this.errorMessage = ""; },
    selectBody(opt) { this.selectedBody = opt; this.mode = "body"; this.showBody = false; this.errorMessage = ""; },
    selectDocumentation(opt) { this.selectedDocumentation = opt; this.mode = "documentation"; this.showDocumentation = false; this.errorMessage = ""; },

    // ---------- Words group ----------
    selectWords(n) {
      if (this.disableWordsGroup) return;
      this.wordsSelection = n;
      this.showWordsCustom = false;
      this.wordsCustom = "";
      this.errorMessage = "";
      this.validateWords(true);
    },
    toggleWordsCustom() {
      if (this.disableWordsGroup) return;
      this.wordsSelection = "custom";
      this.showWordsCustom = !this.showWordsCustom;
      if (!this.showWordsCustom) { this.wordsSelection = null; this.wordsCustom = ""; }
      this.errorMessage = "";
      this.validateWords();
    },
    validateWords(silent = false) {
      if (this.mode !== "words") return true;
      if (this.wordsSelection === "custom") {
        if (!this.isWordsCustomValid) { if (!silent) this.errorMessage = "Custom words must be 61 or more."; return false; }
      } else if (![15, 30, 60].includes(this.wordsSelection)) {
        if (!silent) this.errorMessage = "Please select a word count."; return false;
      }
      if (!silent) this.errorMessage = "";
      return true;
    },

    // ---------- Time group ----------
    selectTime(n) {
      if (this.disableTimeGroup) return;
      this.timeSelection = n;
      this.showTimeCustom = false;
      this.timeCustom = "";
      this.errorMessage = "";
      this.validateTime(true);
    },
    toggleTimeCustom() {
      if (this.disableTimeGroup) return;
      this.timeSelection = "custom";
      this.showTimeCustom = !this.showTimeCustom;
      if (!this.showTimeCustom) { this.timeSelection = null; this.timeCustom = ""; }
      this.errorMessage = "";
      this.validateTime();
    },
    validateTime(silent = false) {
      if (this.mode !== "time") return true;
      if (this.timeSelection === "custom") {
        if (!this.isTimeCustomValid) { if (!silent) this.errorMessage = "Custom time must be 2 or more."; return false; }
      } else if (![15, 30, 60].includes(this.timeSelection)) {
        if (!silent) this.errorMessage = "Please select a time duration."; return false;
      }
      if (!silent) this.errorMessage = "";
      return true;
    },

    // ---------- Routing helpers ----------
    // Try a sequence of candidate routes (names or paths) and navigate to the first that exists.
    async safePush(candidates) {
      for (const loc of candidates) {
        try {
          const resolved = this.$router.resolve(loc);
          if (resolved && resolved.matched && resolved.matched.length > 0) {
            await this.$router.push(loc);
            return true;
          }
        } catch (_) {
          // ignore and try next
        }
      }
      // If none matched, surface a visible error instead of a blank page.
      this.errorMessage = "Destination page is not registered in your router. Please check your route names/paths.";
      return false;
    },

    // Map the selection to route-candidate arrays (both 'name' and 'path' fallbacks).
    getDestinationCandidates() {
      const query = {
        numbers: this.keys.numbers ? "1" : "0",
        punctuation: this.keys.punctuation ? "1" : "0",
      };

      // Small helper to slugify labels for path fallbacks
      const slug = (s) =>
        String(s)
          .normalize("NFKD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/['’]/g, "")
          .replace(/[^a-zA-Z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .toLowerCase();

      if (this.mode === "words") {
        const count = this.wordsSelection === "custom" ? this.wordsCustom : this.wordsSelection;
        return [
          { name: "Words", query: { ...query, count: String(count) } },
          { path: "/words", query: { ...query, count: String(count) } },
          { path: "/Words", query: { ...query, count: String(count) } },
        ];
      }

      if (this.mode === "time") {
        const seconds = this.timeSelection === "custom" ? this.timeCustom : this.timeSelection;
        return [
          { name: "Time", query: { ...query, seconds: String(seconds) } },
          { path: "/time", query: { ...query, seconds: String(seconds) } },
          { path: "/Time", query: { ...query, seconds: String(seconds) } },
        ];
      }

      if (this.mode === "clinical") {
        const label = this.selectedClinical;

        // IMPORTANT MAPPINGS (as requested):
        // doctors prescription -> DoctorsPrescrip.vue
        const clinicalMap = {
          "Diagnosis": { names: ["Diagnosis"], paths: ["/diagnosis", "/Diagnosis"] },
          "Doctor’s Prescription": { names: ["DoctorsPrescrip"], paths: ["/DoctorsPrescrip", "/doctorsprescrip"] },
          "Doctor's Prescription": { names: ["DoctorsPrescrip"], paths: ["/DoctorsPrescrip", "/doctorsprescrip"] },
          "Patient Interview": { names: ["PatientInterview"], paths: ["/patientinterview", "/PatientInterview"] },
        };

        const entry = clinicalMap[label] || { names: [], paths: ["/loggedin"] };
        const candidates = [
          ...entry.names.map((n) => ({ name: n, query })),
          ...entry.paths.map((p) => ({ path: p, query })),
          // generic slug fallback
          { path: `/${slug(label)}`, query },
        ];
        return candidates;
      }

      if (this.mode === "body") {
        const label = this.selectedBody;

        // IMPORTANT MAPPINGS (as requested):
        // nervous system -> NervousSys.vue
        // circulatory system -> CirculatorySys.vue
        // respiratory system -> RespiratorySys.vue
        const bodyMap = {
          "Nervous System": { names: ["NervousSys"], paths: ["/NervousSys", "/nervoussys"] },
          "Circulatory System": { names: ["CirculatorySys"], paths: ["/CirculatorySys", "/circulatorysys"] },
          "Respiratory System": { names: ["RespiratorySys"], paths: ["/RespiratorySys", "/respiratorysys"] },
        };

        const entry = bodyMap[label] || { names: [], paths: ["/loggedin"] };
        const candidates = [
          ...entry.names.map((n) => ({ name: n, query })),
          ...entry.paths.map((p) => ({ path: p, query })),
          { path: `/${slug(label)}`, query },
        ];
        return candidates;
      }

      if (this.mode === "documentation") {
        const label = this.selectedDocumentation;

        // IMPORTANT MAPPINGS (as requested):
        // discharge instruction -> DischargeInstruc.vue
        const docMap = {
          "Nursing Notes": { names: ["NursingNotes"], paths: ["/NursingNotes", "/nursingnotes"] },
          "Discharge Instructions": { names: ["DischargeInstruc"], paths: ["/DischargeInstruc", "/dischargeinstruc"] },
          "Discharge Instruction": { names: ["DischargeInstruc"], paths: ["/DischargeInstruc", "/dischargeinstruc"] },
        };

        const entry = docMap[label] || { names: [], paths: ["/loggedin"] };
        const candidates = [
          ...entry.names.map((n) => ({ name: n, query })),
          ...entry.paths.map((p) => ({ path: p, query })),
          { path: `/${slug(label)}`, query },
        ];
        return candidates;
      }

      return [{ path: "/loggedin" }];
    },

    // ---------- Reset & Done ----------
    resetAll() {
      this.keys = { numbers: false, punctuation: false };
      this.mode = null;

      this.selectedClinical = null;
      this.selectedBody = null;
      this.selectedDocumentation = null;

      this.showClinical = false;
      this.showBody = false;
      this.showDocumentation = false;

      this.wordsSelection = null;
      this.wordsCustom = "";
      this.showWordsCustom = false;

      this.timeSelection = null;
      this.timeCustom = "";
      this.showTimeCustom = false;

      this.errorMessage = "";
    },

    async done() {
      // keep validation strict; redirect ONLY after clicking Done
      if (this.mode === "words" && !this.validateWords()) return;
      if (this.mode === "time" && !this.validateTime()) return;

      if (!this.isFormValid) {
        if (!this.errorMessage) {
          this.errorMessage = "Please complete the selection before continuing.";
        }
        return;
      }

      this.errorMessage = "";
      const candidates = this.getDestinationCandidates();
      await this.safePush(candidates);
    },
  },

  async mounted() {
    await this.fetchUsername();
  },
};
</script> 

<style scoped> 
.app-container { 
  font-family: "Inter", sans-serif; 
  background: #f9fbfd; 
  min-height: 100vh; 
  color: #1f2a44; 
} 

.top-bar { 
  width: 100%; 
  height: 80px; 
  background: #f9fbfd; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0px 215px; 
} 

.logo { 
  font-weight: bold; 
  font-size: 25px; 
  color: #2D539E; 
  cursor: pointer; 
} 

.right-section { 
  display: flex; 
  align-items: center; 
  gap: 15px; 
} 

.username { 
  font-size: 16px; 
  color: #333; 
  cursor: pointer; 
  text-decoration: none; 
} 

.progress-circle { 
  width: 30px; 
  height: 30px; 
  background-color: #2D539E; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
} 

.progress-number { 
  color: white; 
  font-weight: bold; 
  font-size: 15px; 
} 

.icon-img { 
  height: 30px; 
  width: auto; 
  cursor: pointer; 
} 

/* ---------- CUSTOMIZE LAYOUT ---------- */ 
.customize-shell { 
  max-width: 1120px; 
  margin: 100px auto 60px; 
  padding: 0 24px; 
  position: relative; 
} 

/* Close Button */ 
.close-btn { 
  position: absolute; 
  top: -50px; 
  right: -20px; 
  background: transparent; 
  border: none; 
  font-size: 32px; 
  color: #333; 
  cursor: pointer; 
  line-height: 1; 
} 
.close-btn:hover { color: #2D539E; } 

.group { 
  background: #ffffff; 
  border: 1px solid #e5e9f2; 
  border-radius: 10px; 
  padding: 22px 26px; 
  margin-bottom: 22px; 
} 

.group-title { 
  font-size: 14px; 
  color: #6b7280; 
  margin-bottom: 12px; 
  text-transform: lowercase; 
} 

.group-row { 
  display: flex; 
  align-items: center; 
  gap: 14px; 
} 
.group-row.wrap { flex-wrap: wrap; } 

.pill { 
  appearance: none; 
  border: 1px solid #d8deeb; 
  background: #f3f6fb; 
  color: #2D539E; 
  padding: 6px 12px; 
  border-radius: 8px; 
  font-size: 14px; 
  cursor: pointer; 
  transition: all 0.15s ease; 
  min-width: 96px; 
  text-align: center; 
} 
.pill:hover { filter: brightness(0.97); } 
.pill.active { background: #2D539E; color: #ffffff; border-color: #2D539E; } 
.pill:disabled { background: #e9edf5; color: #a0aec0; cursor: not-allowed; } 

.pill.with-caret { display: inline-flex; align-items: center; justify-content: center; gap: 8px; } 
.caret { font-size: 12px; opacity: 0.9; } 

.custom-time-wrapper { display: flex; align-items: center; gap: 10px; } 
.custom-input { width: 90px; padding: 10px; border: 1px solid #d8deeb; border-radius: 6px; font-size: 14px; outline: none; } 
.custom-input:focus { border-color: #2D539E; } 

.dropdown-wrapper { position: relative; } 
.dropdown { 
  position: absolute; 
  top: calc(100% + 8px); 
  left: 0; 
  min-width: 220px; 
  background: #ffffff; 
  border: 1px solid #e3e8f5; 
  box-shadow: 0 8px 24px rgba(25, 44, 92, 0.08); 
  border-radius: 10px; 
  z-index: 10; 
  padding: 8px; 
} 
.dropdown-item { padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 14px; color: #1f2a44; } 
.dropdown-item:hover { background: #f2f6ff; } 
.dropdown-item.selected { background: #e7eefc; color: #2D539E; } 

.footer-actions { display: flex; justify-content: flex-end; gap: 16px; margin-top: 28px; } 

.primary-btn, .secondary-btn { 
  border: none; 
  border-radius: 10px; 
  font-weight: 500; 
  cursor: pointer; 
  font-size: 15px; 
  padding: 10px 25px; 
  transition: transform 0.05s ease, filter 0.1s ease; 
} 
.primary-btn { background: #2D539E; color: #ffffff; } 
.primary-btn:disabled { background: #b0c3e1; cursor: not-allowed; } 
.primary-btn:active, .secondary-btn:active { transform: translateY(1px); } 
.secondary-btn { background: #eef2f9; color: #274472; } 
.secondary-btn:hover { filter: brightness(0.98); } 
.primary-btn:hover { filter: brightness(0.98); } 

.error-message { color: #d93025; font-size: 14px; margin: 10px 0; text-align: right; } 
</style>
