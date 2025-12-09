with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<link rel="stylesheet" href="reminder.css">',
    '<link rel="stylesheet" href="reminder.css">\r\n    <link rel="stylesheet" href="overflow-fix.css">'
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added overflow-fix.css to index.html")
