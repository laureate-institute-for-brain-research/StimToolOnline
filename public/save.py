from flask import Flask, request, redirect

app = Flask(__name__)

@app.route('/', methods=['POST'])
def handle_post():
    if request.method == 'POST':
        custom_string = request.form['customString']
        id_and_row = custom_string.split("|")
        id = id_and_row[0]
        row = id_and_row[1].split(";")
        
        filename = id + '_somatomapdata.csv'
        
        # open csv file for writing
        with open(filename, 'a') as f:
            # write each row at a time to a file
            f.write(','.join(row) + '\n')
        
        # Redirect back to the HTML page
        return redirect("index.html")

if __name__ == '__main__':
    app.run(debug=True)
