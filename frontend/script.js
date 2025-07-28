const app = document.getElementById('app');
const API_URL = 'http://127.0.0.1:5000';

function showLoginForm() {
    app.innerHTML = `
        <h2>Login</h2>
        <form id="login-form">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="#" id="show-register">Register here</a></p>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert('Login successful!');
            showProjectHistoryPage();
        } else {
            alert('Login failed!');
        }
    });

    document.getElementById('show-register').addEventListener('click', () => {
        showRegisterForm();
    });
}

function showProjectHistoryPage() {
    app.innerHTML = `
        <h2>My Projects History</h2>
        <div id="projects-list"></div>
        <hr>
        <h2>Create New Project</h2>
        <form id="project-form">
            <input type="text" id="project-name" placeholder="Project Name" required>
            <textarea id="description" placeholder="Project Description"></textarea>
            <h3>Materials</h3>
            <div id="materials-container">
                <!-- Materials will be added here -->
            </div>
            <button type="button" id="add-material">Add Material</button>
            <button type="submit">Create Project</button>
        </form>
    `;

    const materialsContainer = document.getElementById('materials-container');
    let materialCount = 0;

    document.getElementById('add-material').addEventListener('click', () => {
        materialCount++;
        const materialDiv = document.createElement('div');
        materialDiv.innerHTML = `
            <input type="text" class="material-name" placeholder="Material Name" required>
            <input type="number" class="material-quantity" placeholder="Quantity" required>
        `;
        materialsContainer.appendChild(materialDiv);
    });

    document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const projectName = document.getElementById('project-name').value;
        const description = document.getElementById('description').value;
        const materials = [];
        const materialNameInputs = document.querySelectorAll('.material-name');
        const materialQuantityInputs = document.querySelectorAll('.material-quantity');

        for (let i = 0; i < materialNameInputs.length; i++) {
            materials.push({
                name: materialNameInputs[i].value,
                quantity: materialQuantityInputs[i].value
            });
        }

        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_name: projectName,
                description: description,
                materials: materials
            })
        });

        if (response.ok) {
            alert('Project created successfully!');
            showProjectHistoryPage();
        } else {
            alert('Failed to create project.');
        }
    });

    const projectsList = document.getElementById('projects-list');

    async function fetchProjects() {
        const response = await fetch(`${API_URL}/projects`);
        const projects = await response.json();
        projectsList.innerHTML = '';
        for (const project of projects) {
            const projectDiv = document.createElement('div');
            projectDiv.innerHTML = `
                <h3>${project.project_name}</h3>
                <p>${project.description}</p>
                <p>Total Emissions: ${project.total_emissions || 'Not calculated'}</p>
                <button class="calculate-btn" data-id="${project.id}">Calculate</button>
                <button class="view-results-btn" data-id="${project.id}">View Results</button>
            `;
            projectsList.appendChild(projectDiv);
        }
    }

    projectsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('calculate-btn')) {
            const projectId = e.target.dataset.id;
            const response = await fetch(`${API_URL}/projects/${projectId}/calculate`, {
                method: 'POST'
            });
            if (response.ok) {
                fetchProjects();
            } else {
                alert('Calculation failed!');
            }
        } else if (e.target.classList.contains('view-results-btn')) {
            const projectId = e.target.dataset.id;
            showResultsPage(projectId);
        }
    });

    fetchProjects();
}

async function showResultsPage(projectId) {
    const response = await fetch(`${API_URL}/projects/${projectId}`);
    const project = await response.json();

    app.innerHTML = `
        <h2>${project.project_name} Results</h2>
        <p>${project.description}</p>
        <p>Total Emissions: ${project.total_emissions.toFixed(2)} kg CO2e</p>
        <canvas id="emissions-chart"></canvas>
        <hr>
        <h3>Suggestions for Improvement</h3>
        <ul id="suggestions-list"></ul>
        <button id="back-to-projects">Back to Projects</button>
    `;

    const suggestionsList = document.getElementById('suggestions-list');
    const suggestionsResponse = await fetch(`${API_URL}/projects/${projectId}/suggestions`);
    const suggestions = await suggestionsResponse.json();
    for (const suggestion of suggestions) {
        const li = document.createElement('li');
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
    }

    document.getElementById('back-to-projects').addEventListener('click', () => {
        showProjectHistoryPage();
    });

    const ctx = document.getElementById('emissions-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: project.materials.map(m => m.material_name),
            datasets: [{
                label: 'Emissions (kg CO2e)',
                data: project.materials.map(m => m.quantity * m.emission_factor),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function showRegisterForm() {
    app.innerHTML = `
        <h2>Register</h2>
        <form id="register-form">
            <input type="text" id="username" placeholder="Username" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Register</button>
        </form>
        <p>Already have an account? <a href="#" id="show-login">Login here</a></p>
    `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            alert('Registration successful! Please login.');
            showLoginForm();
        } else {
            alert('Registration failed!');
        }
    });

    document.getElementById('show-login').addEventListener('click', () => {
        showLoginForm();
    });
}


showLoginForm();
