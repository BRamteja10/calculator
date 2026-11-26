const display = document.getElementById("display");

function appendValue(value) {
    const current = display.value;
    const operators = ["+", "-", "*", "/", "%"];

    if (operators.includes(value) && !current) {
        return;
    }

    if (operators.includes(value)) {
        if (operators.includes(current.slice(-1))) {
            display.value = current.slice(0, -1) + value;
            return;
        }
    }

    if (value === ".") {
        const lastNumber = current.split(/[+\-*/%]/).pop();
        if (lastNumber.includes(".")) {
            return;
        }
    }

    display.value = current + value;
}

function clearDisplay() {
    display.value = "";
}

function deleteLast() {
    display.value = display.value.slice(0, -1);
}

function calculate() {
    if (!display.value) {
        return;
    }

    try {
        if (!/^[0-9+\-*/%.]+$/.test(display.value)) {
            throw new Error("Invalid expression");
        }

        const result = Function('"use strict"; return (' + display.value + ")")();
        if (!Number.isFinite(result)) {
            throw new Error("Invalid result");
        }

        display.value = String(Number(result.toPrecision(12)));
    } catch (error) {
        display.value = "Error";
    }
}

document.addEventListener("keydown", (event) => {
    if (/^[0-9+\-*/%.]$/.test(event.key)) {
        appendValue(event.key);
    } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculate();
    } else if (event.key === "Backspace") {
        deleteLast();
    } else if (event.key === "Escape") {
        clearDisplay();
    }
});
