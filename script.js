document.addEventListener("DOMContentLoaded", function () {
  // Get page sections
  const landingSection = document.getElementById("landing-section");
  const formSection = document.getElementById("form-section");
  const resultsSection = document.getElementById("results-section");

  // Get buttons
  const startBtn = document.getElementById("start-btn");
  const calculateBtn = document.getElementById("calculate-btn");
  const startOverBtn = document.getElementById("start-over-btn");
  const exportBtn = document.getElementById("export-btn");

  // Get results elements
  const healthScore = document.getElementById("health-score");
  const healthClassification = document.getElementById("health-classification");
  const circularProgress = document.querySelector(".circular-progress");
  const bmiValue = document.getElementById("bmi-value");
  const bmiCategory = document.getElementById("bmi-category");
  const bmrValue = document.getElementById("bmr-value");
  const tdeeValue = document.getElementById("tdee-value");
  const recommendedCalories = document.getElementById("recommended-calories");
  const proteinValue = document.getElementById("protein-value");
  const carbsValue = document.getElementById("carbs-value");
  const fatsValue = document.getElementById("fats-value");
  const recommendationsList = document.getElementById("recommendations-list");

  // Store calculation results globally for PDF export
  let currentResults = {};

  // Button event listeners
  startBtn.addEventListener("click", function () {
    // Hide landing, show form
    landingSection.style.display = "none";
    formSection.style.display = "block";
    resultsSection.style.display = "none";
  });

  calculateBtn.addEventListener("click", function () {
    currentResults = calculateResults();
    // Hide form, show results
    landingSection.style.display = "none";
    formSection.style.display = "none";
    resultsSection.style.display = "block";
  });

  startOverBtn.addEventListener("click", function () {
    // Reset form
    document.getElementById("male").checked = true;
    document.getElementById("age").value = 30;
    document.getElementById("height").value = 175;
    document.getElementById("weight").value = 70;
    document.getElementById("activity").value = 1.55;
    document.getElementById("goal").value = "maintain";

    // Show landing, hide others
    landingSection.style.display = "block";
    formSection.style.display = "none";
    resultsSection.style.display = "none";
  });

  exportBtn.addEventListener("click", function () {
    generatePDF(currentResults);
  });

  function calculateResults() {
    // Get form values
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const age = parseInt(document.getElementById("age").value) || 30;
    const height = parseInt(document.getElementById("height").value) || 175;
    const weight = parseInt(document.getElementById("weight").value) || 70;
    const activityLevel = parseFloat(document.getElementById("activity").value);
    const goal = document.getElementById("goal").value;

    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // Determine BMI category
    let bmiCategoryText = "";
    if (bmi < 18.5) bmiCategoryText = "Underweight";
    else if (bmi < 25) bmiCategoryText = "Normal";
    else if (bmi < 30) bmiCategoryText = "Overweight";
    else bmiCategoryText = "Obese";

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityLevel;

    // Adjust based on goal
    let recommendedCaloriesValue;
    if (goal === "lose") {
      recommendedCaloriesValue = tdee - 500;
    } else if (goal === "gain") {
      recommendedCaloriesValue = tdee + 500;
    } else {
      recommendedCaloriesValue = tdee;
    }

    // Calculate macronutrients
    // Protein: 30%, Carbs: 45%, Fats: 25%
    const proteinCalories = recommendedCaloriesValue * 0.3;
    const carbsCalories = recommendedCaloriesValue * 0.45;
    const fatsCalories = recommendedCaloriesValue * 0.25;

    const proteinGrams = Math.round(proteinCalories / 4); // 4 calories per gram
    const carbsGrams = Math.round(carbsCalories / 4); // 4 calories per gram
    const fatsGrams = Math.round(fatsCalories / 9); // 9 calories per gram

    // Health score calculation
    let healthScoreValue = 50; // Base score

    // Add points for normal BMI
    if (bmi >= 18.5 && bmi < 25) healthScoreValue += 20;
    else if (bmi >= 25 && bmi < 30) healthScoreValue += 10;

    // Add points for activity level
    if (activityLevel === 1.2) healthScoreValue += 0;
    else if (activityLevel === 1.375) healthScoreValue += 10;
    else if (activityLevel === 1.55) healthScoreValue += 15;
    else if (activityLevel === 1.725) healthScoreValue += 20;
    else if (activityLevel === 1.9) healthScoreValue += 25;

    // Cap at 100
    healthScoreValue = Math.min(healthScoreValue, 100);

    // Health classification
    let healthClassificationText = "";
    if (healthScoreValue < 50) healthClassificationText = "Needs Improvement";
    else if (healthScoreValue < 70) healthClassificationText = "Fair";
    else if (healthScoreValue < 85) healthClassificationText = "Good";
    else healthClassificationText = "Excellent";

    // Update health score circle
    updateHealthScoreCircle(healthScoreValue);

    // Update UI with results
    healthScore.textContent = healthScoreValue;
    healthClassification.textContent = healthClassificationText;
    bmiValue.textContent = bmi.toFixed(1);
    bmiCategory.textContent = bmiCategoryText;
    bmrValue.textContent = Math.round(bmr).toLocaleString();
    tdeeValue.textContent = Math.round(tdee).toLocaleString();
    recommendedCalories.textContent = Math.round(
      recommendedCaloriesValue
    ).toLocaleString();
    proteinValue.textContent = proteinGrams + "g";
    carbsValue.textContent = carbsGrams + "g";
    fatsValue.textContent = fatsGrams + "g";

    // Generate recommendations
    const recommendations = generateRecommendations(
      goal,
      bmiCategoryText,
      activityLevel,
      recommendedCaloriesValue,
      proteinGrams
    );

    // Return the results object for PDF export
    return {
      gender,
      age,
      height,
      weight,
      activityLevel,
      goal,
      bmi: bmi.toFixed(1),
      bmiCategory: bmiCategoryText,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      recommendedCalories: Math.round(recommendedCaloriesValue),
      protein: proteinGrams,
      carbs: carbsGrams,
      fats: fatsGrams,
      healthScore: healthScoreValue,
      healthClassification: healthClassificationText,
      recommendations,
    };
  }

  function updateHealthScoreCircle(score) {
    // Convert score to angle (0-100 to 0-360 degrees)
    const angle = (score / 100) * 360;

    // Update the progress property
    circularProgress.style.setProperty("--progress", `${angle}deg`);

    // Set color based on score
    let scoreColor;
    if (score < 50) {
      scoreColor = "#F56565"; // Red
    } else if (score < 70) {
      scoreColor = "#ED8936"; // Orange
    } else if (score < 85) {
      scoreColor = "#4a90e2"; // Blue
    } else {
      scoreColor = "#48BB78"; // Green
    }

    // Update the score color property
    circularProgress.style.setProperty("--score-color", scoreColor);
  }

  function generateRecommendations(
    goal,
    bmiCategory,
    activityLevel,
    calories,
    protein
  ) {
    // Clear previous recommendations
    recommendationsList.innerHTML = "";

    const recommendations = [];

    // Goal-based recommendations
    if (goal === "lose") {
      recommendations.push(
        `Aim for a calorie deficit of ~500 calories daily (${Math.round(
          calories
        )} calories)`
      );
      recommendations.push(
        "Include at least 30 minutes of cardio exercise most days"
      );
      recommendations.push(
        `Focus on high-protein foods to preserve muscle mass (aim for ${protein}g daily)`
      );
    } else if (goal === "gain") {
      recommendations.push(
        `Consume a calorie surplus of ~500 calories daily (${Math.round(
          calories
        )} calories)`
      );
      recommendations.push("Prioritize strength training to build muscle mass");
      recommendations.push(
        `Include protein with each meal (aim for ${protein}g daily)`
      );
    } else {
      recommendations.push(
        `Maintain your intake around ${Math.round(calories)} calories daily`
      );
      recommendations.push(
        "Balance cardio and strength training for overall fitness"
      );
    }

    // BMI-based recommendations
    if (bmiCategory === "Underweight") {
      recommendations.push(
        "Focus on nutrient-dense foods high in healthy fats and protein"
      );
      recommendations.push("Consider adding nutritious snacks between meals");
    } else if (bmiCategory === "Overweight" || bmiCategory === "Obese") {
      recommendations.push(
        "Prioritize whole foods and reduce processed food consumption"
      );
      recommendations.push("Stay hydrated - aim for 2-3 liters of water daily");
    }

    // Activity-based recommendations
    if (activityLevel < 1.4) {
      recommendations.push(
        "Aim to get at least 150 minutes of moderate exercise per week"
      );
      recommendations.push(
        "Start with walking 30 minutes per day, 5 days a week"
      );
    } else if (activityLevel < 1.6) {
      recommendations.push("Add 2 days of strength training per week");
      recommendations.push("Incorporate flexibility and balance exercises");
    } else {
      recommendations.push(
        "Ensure adequate recovery between intense workout sessions"
      );
      recommendations.push(
        "Consider adding variety to your routine to prevent plateaus"
      );
    }

    // General health recommendations
    recommendations.push("Aim for 7-8 hours of sleep each night");
    recommendations.push(
      "Include a variety of colorful vegetables and fruits daily"
    );

    // Add the first 4 recommendations to the list
    for (let i = 0; i < Math.min(4, recommendations.length); i++) {
      const li = document.createElement("li");
      li.textContent = recommendations[i];
      recommendationsList.appendChild(li);
    }

    // Return all recommendations for PDF export
    return recommendations.slice(0, 4);
  }

  // PDF Generation function
  function generatePDF(results) {
    // Check if the jsPDF script is loaded
    if (typeof jspdf === "undefined") {
      // Load jsPDF script if not already loaded
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        function () {
          // Load html2canvas script
          loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            function () {
              // Create PDF after scripts are loaded
              createPDF(results);
            }
          );
        }
      );
    } else {
      // Create PDF if scripts are already loaded
      createPDF(results);
    }
  }

  // Helper function to load external scripts
  function loadScript(url, callback) {
    const script = document.createElement("script");
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
  }

  // Function to create PDF with jsPDF
  function createPDF(results) {
    // Create a new PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set document properties
    doc.setProperties({
      title: "FitPulse Health Assessment Report",
      subject: "Health and Fitness Metrics",
      author: "FitPulse App",
      creator: "FitPulse",
    });

    // Add logo and title
    doc.setFontSize(22);
    doc.setTextColor(74, 144, 226); // #4a90e2
    doc.text("FitPulse", 105, 20, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(45, 55, 72); // #2D3748
    doc.text("Health Assessment Report", 105, 30, { align: "center" });

    // Add date
    doc.setFontSize(10);
    doc.setTextColor(113, 128, 150); // #718096
    const today = new Date();
    const dateStr = today.toLocaleDateString();
    doc.text(`Generated on: ${dateStr}`, 105, 38, { align: "center" });

    // Add divider
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.line(20, 42, 190, 42);

    // Health Score Section
    doc.setFontSize(14);
    doc.setTextColor(45, 55, 72); // #2D3748
    doc.text("Health Score", 20, 55);

    // Add health score circle (simplified representation in PDF)
    doc.setFillColor(getScoreColor(results.healthScore));
    doc.circle(40, 70, 10, "F");

    doc.setFontSize(16);
    doc.setTextColor(45, 55, 72); // #2D3748
    doc.text(`${results.healthScore}`, 65, 70);

    doc.setFontSize(12);
    doc.text(`Classification: ${results.healthClassification}`, 85, 70);

    // Personal Metrics Section
    doc.setFontSize(14);
    doc.setTextColor(45, 55, 72); // #2D3748
    doc.text("Personal Metrics", 20, 90);

    doc.setFontSize(10);
    doc.text(`Age: ${results.age} years`, 25, 100);
    doc.text(`Weight: ${results.weight} kg`, 25, 107);
    doc.text(`Height: ${results.height} cm`, 25, 114);
    doc.text(`Gender: ${capitalizeFirstLetter(results.gender)}`, 25, 121);

    doc.text(`BMI: ${results.bmi} (${results.bmiCategory})`, 100, 100);

    let activityText = "Sedentary";
    if (results.activityLevel === 1.375) activityText = "Lightly Active";
    else if (results.activityLevel === 1.55) activityText = "Moderately Active";
    else if (results.activityLevel === 1.725) activityText = "Very Active";
    else if (results.activityLevel === 1.9) activityText = "Extra Active";

    doc.text(`Activity Level: ${activityText}`, 100, 107);

    let goalText = "Maintain Weight";
    if (results.goal === "lose") goalText = "Lose Weight";
    else if (results.goal === "gain") goalText = "Gain Weight";

    doc.text(`Goal: ${goalText}`, 100, 114);

    // Calorie Details Section
    doc.setFontSize(14);
    doc.setTextColor(45, 55, 72); // #2D3748
    doc.text("Calorie & Nutrition Details", 20, 140);

    doc.setFontSize(10);
    doc.text(
      `Basal Metabolic Rate (BMR): ${results.bmr.toLocaleString()} calories/day`,
      25,
      150
    );
    doc.text(
      `Total Daily Energy Expenditure: ${results.tdee.toLocaleString()} calories/day`,
      25,
      157
    );
    doc.text(
      `Recommended Daily Intake: ${results.recommendedCalories.toLocaleString()} calories/day`,
      25,
      164
    );

    // Macronutrient breakdown
    doc.setFontSize(12);
    doc.text("Recommended Macronutrient Breakdown:", 25, 174);

    // Create a simple table for macros
    doc.setFillColor(235, 248, 255); // #EBF8FF
    doc.rect(25, 178, 160, 25, "F");

    doc.setDrawColor(190, 227, 248); // #BEE3F8
    doc.rect(25, 178, 160, 25, "S");
    doc.line(78, 178, 78, 203);
    doc.line(131, 178, 131, 203);

    doc.setFontSize(10);
    doc.setTextColor(44, 82, 130); // #2C5282
    doc.text("PROTEIN (30%)", 52, 185, { align: "center" });
    doc.text("CARBS (45%)", 105, 185, { align: "center" });
    doc.text("FATS (25%)", 157, 185, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(45, 55, 72); // #2D3748
    doc.text(`${results.protein}g`, 52, 195, { align: "center" });
    doc.text(`${results.carbs}g`, 105, 195, { align: "center" });
    doc.text(`${results.fats}g`, 157, 195, { align: "center" });

    // Recommendations Section
    doc.setFontSize(14);
    doc.setTextColor(45, 55, 72); // #2D3748
    doc.text("Personalized Recommendations", 20, 220);

    doc.setFontSize(10);
    let yPos = 230;
    results.recommendations.forEach((recommendation, index) => {
      doc.text(`${index + 1}. ${recommendation}`, 25, yPos);
      yPos += 10;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192); // #A0AEC0
    doc.text(
      "This report is generated by FitPulse Health Assessment App.",
      105,
      280,
      { align: "center" }
    );
    doc.text(
      "The information provided is for educational purposes only and is not medical advice.",
      105,
      285,
      { align: "center" }
    );

    // Save the PDF
    doc.save("FitPulse-Health-Report.pdf");
  }

  // Helper function to get color based on health score
  function getScoreColor(score) {
    if (score < 50) return "#F56565"; // Red
    else if (score < 70) return "#ED8936"; // Orange
    else if (score < 85) return "#4a90e2"; // Blue
    else return "#48BB78"; // Green
  }

  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
});
