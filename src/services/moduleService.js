/**
 * Module Service - Handles loading and managing nursing modules
 * Replaces temporary hardcoded modules with real module files
 */

import moduleStorageService from './moduleStorageService'

class ModuleService {
  constructor() {
    this.modules = []
    this.initialized = false
    this.useDatabase = false // Temporarily force file-based storage to fix typing test content issue
  }

  /**
   * Get module content with difficulty-based text transformation
   * @param {string} moduleValue - The module identifier
   * @param {string} difficulty - Difficulty level ('easy', 'normal', 'hard' or 'Easy', 'Normal', 'Hard')
   * @returns {Promise<string>} The transformed module content
   */
  async getModuleContentWithDifficulty(moduleValue, difficulty) {
    try {
      // Find the module by value or ID
      const module = this.modules.find(m => 
        m.value === moduleValue || 
        m.id === moduleValue ||
        m.label.toLowerCase().replace(/\s+/g, '-') === moduleValue
      );

      if (!module) {
        throw new Error(`Module not found: ${moduleValue}`);
      }

      // If no difficulty specified, return original content
      if (!difficulty) {
        return await this.getModuleContent(moduleValue);
      }

      // Normalize difficulty level
      const normalizedDifficulty = difficulty.toLowerCase();
      let difficultyFile = '';
      
      switch (normalizedDifficulty) {
        case 'easy':
          difficultyFile = 'Easy.txt';
          break;
        case 'normal':
          difficultyFile = 'Normal.txt';
          break;
        case 'hard':
          difficultyFile = 'Hard.txt';
          break;
        default:
          // Fallback to original content if difficulty not recognized
          return await this.getModuleContent(moduleValue);
      }

      // Load content from the new module directory with fallback mechanism
      let fullContent = '';
      let fetchError = null;
      
      try {
        const response = await fetch(`/new module/${difficultyFile}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        fullContent = await response.text();
        
        // Check if we got HTML instead of text content (common in production)
        if (fullContent.includes('<!doctype html') || fullContent.includes('<html')) {
          throw new Error('Received HTML content instead of text file - likely a routing issue in production');
        }
        
        if (!fullContent || fullContent.trim().length === 0) {
          throw new Error(`Difficulty file ${difficultyFile} is empty or contains no valid content.`);
        }
      } catch (error) {
        fetchError = error;
        console.warn(`⚠️ Failed to fetch ${difficultyFile}:`, error.message);
        
        // Fallback: Try to get content from the original module files
        console.log(`🔄 Attempting fallback to original module content for ${module.label}`);
        try {
          return await this.getModuleContent(moduleValue);
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed:`, fallbackError.message);
          throw new Error(`Both primary and fallback methods failed. Primary error: ${error.message}. Fallback error: ${fallbackError.message}`);
        }
      }

      // Extract the specific module content from the difficulty file
      console.log(`🔍 About to extract module "${module.label}" from ${difficultyFile}`);
      console.log(`📄 File content length: ${fullContent.length} characters`);
      console.log(`📄 First 500 characters of content:`, fullContent.substring(0, 500));
      
      const moduleContent = this.extractModuleFromDifficultyFile(fullContent, module.label);
      
      if (!moduleContent) {
        throw new Error(`Module "${module.label}" not found in ${difficultyFile}`);
      }

      return moduleContent.trim();
      
    } catch (error) {
      console.error(`❌ Error getting module content with difficulty for ${moduleValue}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract specific module content from difficulty file
   * @param {string} fullContent - The full content of the difficulty file
   * @param {string} moduleLabel - The module label to extract
   * @returns {string|null} The extracted module content or null if not found
   */
  extractModuleFromDifficultyFile(fullContent, moduleLabel) {
    const lines = fullContent.split('\n');
    let moduleStartIndex = -1;
    let moduleEndIndex = -1;
    
    console.log(`🔍 Looking for module: "${moduleLabel}"`);
    console.log(`📄 File has ${lines.length} lines`);
    
    // Find the start of the target module
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Debug: Log lines that might be module headers
      if (line.length > 10 && /^[A-Z]/.test(line) && !line.includes('.')) {
        console.log(`🔍 Checking line ${i}: "${line}"`);
      }
      
      // Check if this line matches our module header
      if (line.toLowerCase() === moduleLabel.toLowerCase() || 
          (line.length > 0 && line.toLowerCase().includes(moduleLabel.toLowerCase())) ||
          (moduleLabel.toLowerCase().includes(line.toLowerCase()) && line.length > 5)) {
        console.log(`✅ Found module header at line ${i}: "${line}"`);
        moduleStartIndex = i;
        break;
      }
    }
    
    if (moduleStartIndex === -1) {
      console.log(`❌ Module header "${moduleLabel}" not found in content`);
      console.log(`📋 Available module-like headers found:`);
      for (let i = 0; i < Math.min(lines.length, 200); i++) {
        const line = lines[i].trim();
        if (line.length > 10 && /^[A-Z]/.test(line) && !line.includes('.') && !line.includes(',')) {
          console.log(`  - Line ${i}: "${line}"`);
        }
      }
      return null;
    }
    
    // Find the end of this module (start of next module or end of file)
    moduleEndIndex = lines.length; // Default to end of file
    
    for (let i = moduleStartIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line looks like a module header (not empty, not a difficulty level, and substantial content)
      if (line.length > 0 && 
          !['Easy', 'Normal', 'Hard', 'Medium'].includes(line) &&
          line.length > 10 && // Module names are typically longer
          /^[A-Z]/.test(line) && // Starts with capital letter
          !line.includes('.') && // Not a sentence
          !line.includes(',') && // Not a sentence
          line.split(' ').length <= 6) { // Module names are typically short phrases
        
        // This looks like another module header
        moduleEndIndex = i;
        break;
      }
    }
    
    // Extract the content between start and end
    let contentLines = lines.slice(moduleStartIndex, moduleEndIndex);
    
    // Remove the module header (first line)
    contentLines = contentLines.slice(1);
    
    // Remove difficulty level if it's the first line after header
    if (contentLines.length > 0) {
      const firstLine = contentLines[0].trim();
      if (['Easy', 'Normal', 'Hard', 'Medium'].includes(firstLine)) {
        contentLines = contentLines.slice(1);
      }
    }
    
    // Remove empty lines at the beginning
    while (contentLines.length > 0 && contentLines[0].trim() === '') {
      contentLines = contentLines.slice(1);
    }
    
    // Remove empty lines at the end
    while (contentLines.length > 0 && contentLines[contentLines.length - 1].trim() === '') {
      contentLines = contentLines.slice(0, -1);
    }
    
    const result = contentLines.join('\n').trim();
    console.log(`✅ Successfully extracted module "${moduleLabel}" with ${result.length} characters`);
    return result;
  }

  /**
   * Force re-upload all modules to database
   */
  async forceReuploadModules() {
    try {
      // Clear existing modules
      await moduleStorageService.clearAllModules()
      
      // Upload all modules
      await moduleStorageService.uploadModulesToDatabase()
      
      // Reload modules
      this.modules = await moduleStorageService.getAllModules()
      
      // Mark as initialized after successful loading
      this.initialized = true
      
      return this.modules.length
    } catch (error) {
      console.error('❌ Error force re-uploading modules:', error)
      throw error
    }
  }

  /**
   * Force refresh modules - clear cache and reinitialize
   */
  forceRefresh() {
    // Reset initialization state
    this.initialized = false
    this.modules = []
    
    // Force file-based modules
    this.useDatabase = false
    
    // Reinitialize with file-based modules
    this.initializeFileBasedModules()
    this.initialized = true
    
    console.log('🔄 Modules force refreshed - now using file-based modules:', this.modules.length)
    return this.modules
  }

  /**
   * Initialize the module service
   * This will check if modules exist in database, if not, upload them
   */
  async initialize() {
    if (this.initialized) return

    try {
      // Check if we should use database storage
      if (this.useDatabase) {
        const modulesExist = await moduleStorageService.checkModulesExist()
        
        if (!modulesExist) {
          await moduleStorageService.uploadModulesToDatabase()
        }
        
        // Load modules from database
        this.modules = await moduleStorageService.getAllModules()
      } else {
        // Fallback to file-based modules (original implementation)
        this.initializeFileBasedModules()
      }
      
      this.initialized = true
    } catch (error) {
      console.error('❌ Error initializing ModuleService:', error)
      // Fallback to file-based modules if database fails
      this.useDatabase = false
      this.initializeFileBasedModules()
      this.initialized = true
    }
  }

  /**
   * Initialize file-based modules (original implementation)
   */
  initializeFileBasedModules() {
    // Define all available modules based on the new 15 nursing modules
    const moduleFiles = [
      'Fundamentals of Nursing Practice.txt',
      'Health Assessment terminologies.txt',
      'Health Education.txt',
      'Theoretical Foundations in Nursing.txt',
      'Community Health Nursing.txt',
      'Nutrition and Dietetics.txt',
      'Maternal and Child Nursing.txt',
      'Nursing Ethics.txt',
      'Medical and Surgical Nursing.txt',
      'Psychiatric Nursing.txt',
      'Nursing Research.txt',
      'Critical Care Nursing.txt',
      'Disaster Nursing.txt',
      'Emergency Nursing.txt',
      'Nursing Leadership and Management.txt'
    ];

    console.log('🔧 Initializing file-based modules with', moduleFiles.length, 'modules');

    // Create module objects with proper formatting
    this.modules = moduleFiles.map((filename, index) => {
      const name = filename.replace(/\.(txt|TXT)$/, '');
      const value = this.createModuleValue(name);
      
      return {
        id: index + 1,
        value: value,
        label: name,
        filename: filename,
        category: this.categorizeModule(name)
      };
    });

    console.log('✅ File-based modules initialized:', this.modules.map(m => m.label));
  }

  /**
   * Create a URL-friendly value from module name
   */
  createModuleValue(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  }

  /**
   * Categorize modules for better organization
   */
  categorizeModule(name) {
    const categories = {
      'Fundamentals': ['Fundamentals of Nursing Practice', 'Nursing Ethics', 'Theoretical Foundations in Nursing'],
      'Clinical': ['Medical and Surgical Nursing', 'Critical Care Nursing', 'Emergency Nursing'],
      'Specialized': ['Maternal and Child Nursing', 'Mental Health and Psychiatric Nursing', 'Psychiatric Nursing', 'Gerontologic Nursing'],
      'Community': ['Community Health Nursing', 'Health Education', 'Disaster Nursing'],
      'Assessment': ['Health Assessment Terminologies'],
      'Management': ['Nursing Leadership and Management', 'Nursing Research'],
      'Nutrition': ['Nutrition and Dietetics']
    };

    for (const [category, moduleNames] of Object.entries(categories)) {
      if (moduleNames.includes(name)) {
        return category;
      }
    }
    return 'General';
  }

  /**
   * Get all available modules
   */
  getModules() {
    if (!this.initialized) {
      console.warn('ModuleService not initialized. Call initialize() first.');
      return [];
    }
    console.log('📋 getModules() called - returning', this.modules.length, 'modules:', this.modules.map(m => m.label));
    return this.modules;
  }

  /**
   * Get modules by category
   */
  getModulesByCategory(category) {
    return this.modules.filter(module => module.category === category);
  }

  /**
   * Get module by value/id
   */
  getModule(identifier) {
    return this.modules.find(module => 
      module.value === identifier || 
      module.id === identifier ||
      module.label === identifier
    );
  }

  /**
   * Load module content (for future use when implementing typing tests)
   */
  async loadModuleContent(moduleValue) {
    if (this.moduleContent.has(moduleValue)) {
      return this.moduleContent.get(moduleValue);
    }

    const module = this.getModule(moduleValue);
    if (!module) {
      throw new Error(`Module not found: ${moduleValue}`);
    }

    try {
      // In a real implementation, you would fetch the file content
      // For now, we'll return a placeholder
      const content = `Content for ${module.label} module`;
      this.moduleContent.set(moduleValue, content);
      return content;
    } catch (error) {
      console.error(`Error loading module content for ${moduleValue}:`, error);
      throw error;
    }
  }

  /**
   * Get module content by module value/ID
   * @param {string} moduleValue - The module identifier
   * @returns {Promise<string>} The module content
   */
  async getModuleContent(moduleValue) {
    await this.initialize()

    // Find the module by value or ID
    const module = this.modules.find(m => 
      m.value === moduleValue || 
      m.id === moduleValue ||
      m.label.toLowerCase().replace(/\s+/g, '-') === moduleValue
    )

    if (!module) {
      throw new Error(`Module not found: ${moduleValue}`)
    }

    try {
      if (this.useDatabase) {
        // Get content from database
        const content = await moduleStorageService.getModuleContent(module.id)
        return content
      } else {
        // Get content from files (original implementation)
        const fileName = module.filename
        
        try {
          const response = await fetch(`/module/${fileName}`)
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const content = await response.text()
          
          // Check if we got HTML instead of text content (common in production)
          if (content.includes('<!doctype html') || content.includes('<html')) {
            throw new Error('Received HTML content instead of text file - likely a routing issue in production')
          }
          
          if (!content || content.trim().length === 0) {
            throw new Error(`Module file ${fileName} is empty or contains no valid content.`)
          }
          
          return content.trim()
        } catch (fetchError) {
          console.warn(`⚠️ Failed to fetch module file ${fileName}:`, fetchError.message)
          
          // Fallback: Generate sample content for the module
          console.log(`🔄 Using generated sample content for ${module.label}`)
          const sampleContent = this.generateSampleContent(module)
          
          if (sampleContent && sampleContent.trim().length > 0) {
            return sampleContent.trim()
          } else {
            throw new Error(`Both file fetch and sample content generation failed for module: ${module.label}`)
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error loading module content for ${moduleValue}:`, error.message)
      throw error
    }
  }

  /**
   * Generate sample content for a module
   * @param {Object} module - The module object
   * @returns {string} Sample content for typing practice
   */
  generateSampleContent(module) {
    const sampleTexts = {
      'community-health-nursing': `Community health nursing focuses on promoting and preserving the health of populations and communities. Nurses work in various settings including schools, workplaces, and community centers. They conduct health assessments, provide education, and implement prevention programs. Key concepts include epidemiology, health promotion, disease prevention, and community assessment. Nurses collaborate with interdisciplinary teams to address health disparities and social determinants of health.`,
      
      'critical-care-nursing': `Critical care nursing involves caring for patients with life-threatening conditions in intensive care units. Nurses monitor vital signs, administer medications, and operate complex medical equipment. They assess patient responses to treatments and collaborate with physicians to adjust care plans. Key skills include hemodynamic monitoring, ventilator management, and emergency response. Critical thinking and rapid decision-making are essential in this high-acuity environment.`,
      
      'emergency-nursing': `Emergency nursing requires rapid assessment and intervention for patients with acute injuries and illnesses. Nurses triage patients based on severity of condition and provide immediate care. They must be proficient in advanced life support, trauma care, and emergency procedures. Documentation must be accurate and timely despite the fast-paced environment. Communication with patients, families, and healthcare teams is crucial during crisis situations.`,
      
      'fundamentals-of-nursing-practice': `Fundamentals of nursing practice encompasses basic nursing principles and skills essential for patient care. This includes infection control, medication administration, vital signs assessment, and patient safety measures. Nurses learn therapeutic communication, cultural competence, and ethical decision-making. Basic procedures such as wound care, catheter insertion, and patient mobility are fundamental skills. The nursing process of assessment, diagnosis, planning, implementation, and evaluation guides practice.`,
      
      'gerontologic-nursing': `Gerontologic nursing specializes in caring for older adults across various healthcare settings. Nurses address age-related changes, chronic conditions, and functional decline. Key areas include fall prevention, medication management, cognitive assessment, and end-of-life care. Understanding normal aging processes versus pathological conditions is essential. Nurses promote independence, dignity, and quality of life for elderly patients while involving families in care decisions.`,
      
      'health-assessment-terminologies': `Health assessment involves systematic collection of subjective and objective data about patient health status. Nurses use inspection, palpation, percussion, and auscultation techniques during physical examinations. Documentation includes chief complaints, history of present illness, past medical history, and review of systems. Assessment findings guide nursing diagnoses and care planning. Accurate terminology and systematic approaches ensure comprehensive patient evaluation.`,
      
      'maternal-and-child-nursing': `Maternal and child nursing encompasses care for women during pregnancy, childbirth, and postpartum periods, as well as pediatric care. Nurses monitor fetal development, assist with labor and delivery, and provide newborn care. Pediatric nursing involves growth and development assessment, immunization schedules, and family-centered care. Age-appropriate communication and developmental considerations are essential when caring for children and adolescents.`,
      
      'medical-and-surgical-nursing': `Medical and surgical nursing involves caring for adult patients with various medical conditions and surgical procedures. Nurses provide preoperative preparation, postoperative monitoring, and ongoing medical management. Key responsibilities include medication administration, wound care, pain management, and patient education. Nurses must understand pathophysiology, treatment modalities, and potential complications for diverse medical and surgical conditions.`,
      
      'mental-health-and-psychiatric-nursing': `Mental health and psychiatric nursing focuses on caring for patients with mental health disorders and substance abuse issues. Nurses conduct mental status examinations, provide therapeutic communication, and administer psychotropic medications. Understanding psychiatric conditions, treatment approaches, and crisis intervention is essential. Nurses work in various settings including inpatient units, community mental health centers, and outpatient clinics.`,
      
      'nursing-ethics': `Nursing ethics involves moral principles and values that guide professional nursing practice. Key ethical principles include autonomy, beneficence, non-maleficence, and justice. Nurses encounter ethical dilemmas related to end-of-life care, informed consent, confidentiality, and resource allocation. Professional codes of ethics provide guidance for decision-making. Nurses must balance patient rights, family wishes, and professional obligations while maintaining integrity and advocacy.`,
      
      'nursing-leadership-and-management': `Nursing leadership and management involves coordinating patient care, supervising staff, and managing healthcare resources. Leaders develop communication skills, conflict resolution abilities, and decision-making competencies. Management responsibilities include staffing, budgeting, quality improvement, and policy development. Effective leaders promote teamwork, professional development, and positive work environments while ensuring safe, quality patient care.`,
      
      'nursing-research': `Nursing research involves systematic investigation to develop knowledge for nursing practice, education, and administration. Research methods include quantitative, qualitative, and mixed-method approaches. Nurses participate in evidence-based practice by critically appraising research literature and implementing findings. Understanding research design, data collection, and statistical analysis helps nurses evaluate study validity and applicability to clinical practice.`,
      
      'nutrition-and-dietetics': `Nutrition and dietetics in nursing involves assessing nutritional status, planning therapeutic diets, and providing nutrition education. Nurses understand macronutrients, micronutrients, and their roles in health and disease. Special dietary considerations include diabetes management, cardiac diets, and enteral nutrition. Collaboration with registered dietitians ensures comprehensive nutritional care for patients with various medical conditions.`,
      
      'psychiatric-nursing': `Psychiatric nursing specializes in caring for individuals with mental health disorders across the lifespan. Nurses develop therapeutic relationships, conduct assessments, and implement treatment plans. Key interventions include medication management, crisis intervention, and group therapy facilitation. Understanding psychiatric medications, side effects, and monitoring parameters is essential. Nurses work in diverse settings from acute inpatient units to community-based programs.`,
      
      'theoretical-foundations-in-nursing': `Theoretical foundations in nursing provide the conceptual framework for professional practice. Major nursing theories include those developed by Nightingale, Henderson, Orem, Roy, and others. These theories guide nursing assessment, intervention, and evaluation processes. Understanding theoretical perspectives helps nurses articulate the unique contribution of nursing to healthcare and provides rationale for nursing actions and decisions.`
    };

    return sampleTexts[module.value] || `Sample content for ${module.label}. This module contains specialized nursing terminology and procedures related to ${module.label.toLowerCase()}. Practice typing medical terminology, procedures, and concepts specific to this nursing specialty. Focus on accuracy and speed while maintaining proper spelling of medical terms.`;
  }

  /**
   * Get formatted options for dropdowns
   */
  getDropdownOptions() {
    return this.modules.map(module => ({
      value: module.value,
      label: module.label
    }));
  }

  /**
   * Get categorized options for grouped dropdowns
   */
  getCategorizedOptions() {
    const categorized = {};
    this.modules.forEach(module => {
      if (!categorized[module.category]) {
        categorized[module.category] = [];
      }
      categorized[module.category].push({
        value: module.value,
        label: module.label
      });
    });
    return categorized;
  }
}

// Create and export a singleton instance
const moduleService = new ModuleService();

export default moduleService;