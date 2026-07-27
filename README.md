# 🧩Maze Generator
This is just a fun project about algorithms and maze generations. Maybe an efficient ai to look for a path through the maze

# 🚀Live Demo
Live deployment link TBD

# 📖About This Project
This project was built as a fun exploration of algorithms and procedural generation. Using a simple index.html file with embedded CSS and JavaScript, it generates a unique maze every time you play

This was also a great excersize in:
* Algorithm implementation (recursive, Eullers,...)
* DOM manipulation with vanilla JavaSCript
* Styling for a clean, polish user experience
* Keep the entire project lightweight and dependency-free

# 🛠️Technologies Used
|  Technology |  Tool Usage  |
| ----------- |  ------------|
|  HTML5 | Page structure and canvas/ and grid layout |
|  CSS3  | Styling, animation, and responsive design  |
|  JavaScript(ES6)  |  Maze generation algorithm and interactivity  |
|  No External Dependencies  | Everything runs locally. Both libraries and framework |

# ✨Features
* Random maze generation using different algorithms
* Interactive and custom controls
* Lightweight deployment with no external dependencies

# 🧠How It Works
The maze is generated using the different algorithms depending on the choice of selection

The maze begins with generated walls where it is on every possible location and is dug out with the use of algorithms.
## Recursive
This algorithm uses recursion to constantly dig new tunnels in maze.

The "digger" also know as the starting point of the algorithm will randomly select a direction to break a wall down and it'll continue breaking walls under strict conditions on where to tunnel doesn't loop back into a block where it has previously dug.

every time it hits a dead end it'll go back in the recursion to a point where they can dig. By the time the recursion reaches back to the beginning, the maze has been completed.

### Maze Features
* There's no loops
* The maze doesn't have many choices for the "correct" path from starting point to finishing point

## Euler

# 🚧Future Improvments
* Add option to run the game on a hexagonal grid
* Add option to chose grid size
* Implement score for the players and a reset button
* Add option for computer to host on local network with players running the game on mobile device

# 💡What I Learned
This project helped me understand:
* How recursive algorithms work
* How Euler's algorithms work
* The importance of visualizing data structures
* Manipulation of the DOM efficiently with vanilla JavaScript
* writing clean, modular code without frameworks
* Debugging logic with console tools

# 📬Contact
Wei (Andy) Wang

Email: ajade.wang8@gmail.com

LinkedIn: linkedin.com/in/andy-wang-79a88b1a4

GitHub: https://github.com/AJadeWang

# 📜License
This project is open source and available under the MIT License


