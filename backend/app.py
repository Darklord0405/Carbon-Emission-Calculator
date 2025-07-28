import requests
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///carbon_calculator.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    projects = db.relationship('Project', backref='user', lazy=True)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    materials = db.relationship('Material', backref='project', lazy=True)
    total_emissions = db.Column(db.Float, nullable=True)

class Material(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    material_name = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)

class EmissionFactor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    material_name = db.Column(db.String(120), unique=True, nullable=False)
    emission_factor = db.Column(db.Float, nullable=False)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    new_user = User(username=data['username'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'New user created!'})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Login failed!'}), 401
    return jsonify({'message': 'Login successful!'})

@app.route('/projects', methods=['GET', 'POST'])
def projects():
    if request.method == 'POST':
        data = request.get_json()
        # Assuming user is logged in, replace with actual user session logic
        user_id = 1
        new_project = Project(
            project_name=data['project_name'],
            description=data['description'],
            user_id=user_id
        )
        db.session.add(new_project)
        db.session.commit()

        for material_data in data['materials']:
            new_material = Material(
                material_name=material_data['name'],
                quantity=material_data['quantity'],
                project_id=new_project.id
            )
            db.session.add(new_material)

        db.session.commit()
        return jsonify({'message': 'Project created successfully!'})
    else: # GET request
        # Assuming user is logged in, replace with actual user session logic
        user_id = 1
        user_projects = Project.query.filter_by(user_id=user_id).all()
        projects_data = []
        for project in user_projects:
            projects_data.append({
                'id': project.id,
                'project_name': project.project_name,
                'description': project.description,
                'total_emissions': project.total_emissions
            })
        return jsonify(projects_data)

@app.route('/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    project = Project.query.get_or_404(project_id)
    materials_data = []
    for material in project.materials:
        emission_factor = EmissionFactor.query.filter_by(material_name=material.material_name).first()
        materials_data.append({
            'id': material.id,
            'material_name': material.material_name,
            'quantity': material.quantity,
            'emission_factor': emission_factor.emission_factor if emission_factor else 0
        })
    project_data = {
        'id': project.id,
        'project_name': project.project_name,
        'description': project.description,
        'total_emissions': project.total_emissions,
        'materials': materials_data
    }
    return jsonify(project_data)

@app.route('/projects/<int:project_id>/calculate', methods=['POST'])
def calculate_footprint(project_id):
    project = Project.query.get_or_404(project_id)
    total_emissions = 0

    for material in project.materials:
        emission_factor = EmissionFactor.query.filter_by(material_name=material.material_name).first()
        if emission_factor:
            total_emissions += material.quantity * emission_factor.emission_factor

    project.total_emissions = total_emissions
    db.session.commit()

    return jsonify({'total_emissions': total_emissions})

@app.route('/projects/<int:project_id>/suggestions', methods=['GET'])
def get_project_suggestions(project_id):
    try:
        response = requests.get('http://127.0.0.1:5001/suggestions')
        response.raise_for_status()  # Raise an exception for bad status codes
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def index():
    return "Carbon Footprint Calculator API"

def add_sample_emission_factors():
    with app.app_context():
        if EmissionFactor.query.count() == 0:
            factors = [
                EmissionFactor(material_name='Concrete', emission_factor=0.13),
                EmissionFactor(material_name='Steel', emission_factor=1.85),
                EmissionFactor(material_name='Wood', emission_factor=0.03),
                EmissionFactor(material_name='Glass', emission_factor=0.85),
                EmissionFactor(material_name='Plastic', emission_factor=6.0),
                EmissionFactor(material_name='Electricity', emission_factor=0.5), # per kWh
                EmissionFactor(material_name='Natural Gas', emission_factor=0.2) # per kWh
            ]
            db.session.bulk_save_objects(factors)
            db.session.commit()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    add_sample_emission_factors()
    app.run(debug=True)
