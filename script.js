
const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");
const historyList = document.getElementById("historyList");
const angleMode = document.getElementById("angleMode");
const memoryStatus = document.getElementById("memoryStatus");

let expression = "";
let memory = 0;
let isDegree = true;
let justCalculated = false;

let history = JSON.parse(
    localStorage.getItem("calculatorHistory") || "[]"
);

function updateDisplay() {
    expressionDisplay.textContent = expression || "0";
    angleMode.textContent = isDegree ? "DEG" : "RAD";
    memoryStatus.textContent = memory !== 0 ? "M" : "";
}

function formatNumber(number) {
    if (!Number.isFinite(number)) {
        throw new Error("Invalid calculation");
    }

    if (Object.is(number, -0)) number = 0;

    return Number(number.toPrecision(12)).toString();
}

// Safe input validation before calculation
function calculateExpression(input) {
    let code = input
        .replace(/π/g, "pi")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .replace(/\^/g, "**")
        .replace(/(\d+(?:\.\d*)?|\.\d+)%/g, "($1/100)")
        .replace(/\bpi\b/g, "Math.PI")
        .replace(/\be\b/g, "Math.E");

    const trigFactor = isDegree ? "Math.PI/180" : "1";

    code = code
        .replace(/\bsin\(/g, `Math.sin((${trigFactor})*`)
        .replace(/\bcos\(/g, `Math.cos((${trigFactor})*`)
        .replace(/\btan\(/g, `Math.tan((${trigFactor})*`)
        .replace(/\bsqrt\(/g, "Math.sqrt(")
        .replace(/\blog\(/g, "Math.log10(")
        .replace(/\bln\(/g, "Math.log(");

    // Reject any characters outside the calculator's language
    if (!/^[0-9+\-*/().,\sA-Za-z]*$/.test(code)) {
        throw new Error("Invalid expression");
    }

    // Only permit the Math functions and constants used above
    const allowed = /^(?:(?:Math\.(?:PI|E|sin|cos|tan|sqrt|log10|log))|[0-9+\-*/().,\s])*$/;

    if (!allowed.test(code)) {
        throw new Error("Invalid expression");
    }

    const answer = Function('"use strict"; return (' + code + ')')();

    return formatNumber(answer);
}

function calculate() {
    if (!expression.trim()) return;

    try {
        const answer = calculateExpression(expression);

        resultDisplay.textContent = answer;

        addHistory(expression, answer);

        expression = answer;
        justCalculated = true;

        updateDisplay();
    } catch (error) {
        resultDisplay.textContent = "Error";
        justCalculated = true;
    }
}

function insertValue(value) {
    if (justCalculated) {
        if (/^[0-9.]$/.test(value)) {
            expression = "";
        }
        justCalculated = false;
    }

    expression += value;
    resultDisplay.textContent = "0";
    updateDisplay();
}

function clearAll() {
    expression = "";
    resultDisplay.textContent = "0";
    justCalculated = false;
    updateDisplay();
}

function deleteLast() {
    if (justCalculated) {
        clearAll();
        return;
    }

    expression = expression.slice(0, -1);
    updateDisplay();
}

function changeSign() {
    if (!expression) return;

    if (expression.startsWith("-(") && expression.endsWith(")")) {
        expression = expression.slice(2, -1);
    } else {
        expression = `-(${expression})`;
    }

    justCalculated = false;
    updateDisplay();
}

function addHistory(original, answer) {
    history.unshift({
        expression: original,
        answer: answer
    });

    history = history.slice(0, 30);

    localStorage.setItem(
        "calculatorHistory",
        JSON.stringify(history)
    );

    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = "";

    if (history.length === 0) {
        historyList.innerHTML =
            '<p class="empty">No calculations yet</p>';
        return;
    }

    history.forEach((item) => {
        const div = document.createElement("div");
        div.className = "history-item";

        const question = document.createElement("p");
        question.textContent = item.expression;

        const answer = document.createElement("strong");
        answer.textContent = "= " + item.answer;

        div.append(question, answer);

        div.addEventListener("click", () => {
            expression = item.answer;
            resultDisplay.textContent = item.answer;
            justCalculated = true;
            updateDisplay();
        });

        historyList.appendChild(div);
    });
}

// Calculator button actions
document.querySelectorAll("[data-insert]").forEach(button => {
    button.addEventListener("click", () => {
        insertValue(button.dataset.insert);
    });
});

document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;

        switch (action) {
            case "calculate":
                calculate();
                break;

            case "clear":
                clearAll();
                break;

            case "delete":
                deleteLast();
                break;

            case "sign":
                changeSign();
                break;

            case "angle":
                isDegree = !isDegree;
                updateDisplay();
                break;

            case "mc":
                memory = 0;
                updateDisplay();
                break;

            case "mr":
                insertValue(String(memory));
                break;

            case "mplus":
            case "mminus":
                try {
                    const current = Number(
                        calculateExpression(expression)
                    );

                    memory += action === "mplus"
                        ? current
                        : -current;

                    updateDisplay();
                } catch {
                    resultDisplay.textContent = "Invalid memory operation";
                }
                break;
        }
    });
});

// Clear calculation history
document.getElementById("clearHistory")
    .addEventListener("click", () => {
        history = [];
        localStorage.removeItem("calculatorHistory");
        renderHistory();
    });

// Keyboard support
document.addEventListener("keydown", event => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        insertValue(key);
    } else if (["+", "-", "*", "/", "(", ")", "%", "^"].includes(key)) {
        insertValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape") {
        clearAll();
    }
});

// Light and dark theme
document.getElementById("themeBtn")
    .addEventListener("click", () => {
        document.body.classList.toggle("light");

        document.getElementById("themeBtn").textContent =
            document.body.classList.contains("light") ? "☾" : "☀";
    });

// Load saved history
renderHistory();
updateDisplay();
