
import json
import os

FILE_PATH = "C:\\Users\\ruiz_\\Music\\monopass-club\\design\\passmonkey_v1Claude.pen"

# Maps Role Name Prefix -> Variable Mapping
ROLE_CONFIG = {
    "Manager": {
        "prefixes": ["Manager", "Gerente"],
        "map": {
            "$gold-primary": "$manager-primary",
            "$gold-tint-10": "$manager-tint-10",
            "$gold-tint-30": "$manager-tint-30",
            "$gold-tint-40": "$manager-tint-30" # approximate mapping
        }
    },
    "RP": {
        "prefixes": ["RP"],
        "map": {
            "$gold-primary": "$rp-primary",
            "$gold-tint-10": "$rp-tint-10",
            "$gold-tint-30": "$rp-tint-30",
            "$gold-tint-40": "$rp-tint-30"
        }
    },
    "Staff": {
        "prefixes": ["Staff"],
        "map": {
            "$gold-primary": "$staff-primary",
            "$gold-tint-10": "$staff-tint-10",
            "$gold-tint-30": "$staff-tint-30",
             "$gold-tint-40": "$staff-tint-30"
        }
    },
    "Director": {
        "prefixes": ["Director"],
        "map": {
            "$gold-primary": "$director-primary",
            "$gold-tint-10": "$director-tint-10",
            "$gold-tint-30": "$director-tint-30",
             "$gold-tint-40": "$director-tint-30"
        }
    }
}

def get_role_for_frame(frame_name):
    if not frame_name:
        return None
    for role, config in ROLE_CONFIG.items():
        for prefix in config["prefixes"]:
            if frame_name.startswith(prefix):
                return role
    return None

def traverse(node, role_map, updates):
    if not isinstance(node, dict):
        return

    node_id = node.get("id")
    
    # Check Fill
    fill = node.get("fill")
    if isinstance(fill, str) and fill in role_map:
        updates.append({"id": node_id, "prop": "fill", "val": role_map[fill]})
    
    # Check Stroke
    stroke = node.get("stroke")
    if isinstance(stroke, dict):
        s_fill = stroke.get("fill")
        if isinstance(s_fill, str) and s_fill in role_map:
             updates.append({"id": node_id, "prop": "stroke", "val": {**stroke, "fill": role_map[s_fill]}})

    # Check Children
    children = node.get("children")
    if isinstance(children, list):
        for child in children:
            traverse(child, role_map, updates)

def main():
    try:
        with open(FILE_PATH, "r", encoding="utf-8") as f:
            content = json.load(f)
            
        all_updates = {}
        
        roots = content if isinstance(content, list) else content.get("children", [])
        
        print(f"Total root nodes found: {len(roots)}")

        for root in roots:
            name = root.get("name", "Unnamed")
            role = get_role_for_frame(name)
            
            if role:
                print(f"Checking frame: {name} as {role}")
                role_map = ROLE_CONFIG[role]["map"]
                role_updates = []
                traverse(root, role_map, role_updates)
                
                if role_updates:
                    print(f"  -> Found {len(role_updates)} updates")
                    all_updates[role] = all_updates.get(role, []) + role_updates
            else:
                print(f"Skipping frame: {name} (No matching role)")

        print(json.dumps(all_updates, indent=2))

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
