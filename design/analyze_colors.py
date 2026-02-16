
import json
import os

FILE_PATH = "C:\\Users\\ruiz_\\Music\\monopass-club\\design\\passmonkey_v1Claude.pen"

ROLES = {
    "Manager": {
        "roots": ["5jb3g", "0HJAM", "ZEQkm", "kyR7i", "2YJLh", "6FVmJ", "0rgK9", "0NXwm", "5n1YB", "MoDx9", "32lxJ", "qT8jA"],
        "map": {
            "$gold-primary": "$manager-primary",
            "$gold-tint-10": "$manager-tint-10",
            "$gold-tint-30": "$manager-tint-30"
        }
    },
    "RP": {
        "roots": ["S3TAo", "febab", "xfxbI", "6YZdD", "vdecl", "DQAIn", "XnA3l", "2ooJb"],
        "map": {
            "$gold-primary": "$rp-primary",
            "$gold-tint-10": "$rp-tint-10",
            "$gold-tint-30": "$rp-tint-30"
        }
    },
    "Staff": {
        "roots": ["6vI8G", "u66xz", "SnCjM", "AiQvp", "ITtTb", "sK8Yk"],
        "map": {
            "$gold-primary": "$staff-primary",
            "$gold-tint-10": "$staff-tint-10",
            "$gold-tint-30": "$staff-tint-30"
        }
    },
     "Director": {
        "roots": ["oXITZ", "BO6ZK", "YnNxy", "UfDAc", "6BWCU"],
        "map": {
            "$gold-primary": "$director-primary",
            "$gold-tint-10": "$director-tint-10",
            "$gold-tint-30": "$director-tint-30"
        }
    }
}

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

        # Content is valid JSON, likely a list of roots or a dict with "children"
        # Pencil file roots are usually a list
        roots = content if isinstance(content, list) else content.get("children", [])

        # Build a map of root_id -> role_key
        root_to_role = {}
        for role, data in ROLES.items():
            for rid in data["roots"]:
                root_to_role[rid] = role

        for root in roots:
            rid = root.get("id")
            if rid in root_to_role:
                role = root_to_role[rid]
                role_map = ROLES[role]["map"]
                role_updates = []
                traverse(root, role_map, role_updates)
                if role_updates:
                    all_updates[role] = all_updates.get(role, []) + role_updates

        print(json.dumps(all_updates, indent=2))

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
