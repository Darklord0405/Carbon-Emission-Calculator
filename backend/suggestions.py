from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/suggestions', methods=['GET'])
def get_suggestions():
    suggestions = [
        "Use renewable energy sources like solar or wind power.",
        "Improve insulation to reduce heating and cooling needs.",
        "Choose sustainable building materials with low carbon footprints.",
        "Install energy-efficient windows and appliances.",
        "Implement a rainwater harvesting system."
    ]
    return jsonify(suggestions)

if __name__ == '__main__':
    app.run(port=5001)
