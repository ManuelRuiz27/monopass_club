
import json
import math

BATCH_SIZE = 25

def format_val(val):
    if isinstance(val, str):
        return f'"{val}"'
    if isinstance(val, dict):
        # Convert dict to JS object string
        items = []
        for k, v in val.items():
            items.append(f'{k}: {format_val(v)}')
        return f'{{{", ".join(items)}}}'
    return str(val)

def main():
    try:
        with open("updates_v2.json", "r", encoding="utf-8-sig") as f:
            content = f.read()
            # Find the first opening brace
            start_index = content.find('{')
            if start_index == -1:
                print("Error: No JSON object found in file")
                return
            json_content = content[start_index:]
            data = json.loads(json_content)
    except Exception as e:
        print(f"Error reading/parsing JSON: {e}")
        return

    all_ops = []
    
    for role, updates in data.items():
        for u in updates:
            # Op format: U("ID", {prop: val})
            op = f'U("{u["id"]}", {{{u["prop"]}: {format_val(u["val"])}}})'
            all_ops.append(op)

    # Split into batches
    total = len(all_ops)
    num_batches = math.ceil(total / BATCH_SIZE)
    
    print(f"Total ops: {total}. Generating {num_batches} batches.")

    for i in range(num_batches):
        batch = all_ops[i*BATCH_SIZE : (i+1)*BATCH_SIZE]
        content = "\n".join(batch)
        filename = f"batch_v2_{i+1}.txt"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Written {filename}")

if __name__ == "__main__":
    main()
