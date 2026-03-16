# Gluttonous Snake – Gyroscope Controller
# Date: 6 February 2026

# Authors:
Yaru Yang/
Yue Xie/
Siyu Xu

⸻

# Optional Blurb

This project explores the use of mobile device motion sensors as a game controller.
Instead of using traditional keyboard input, players control the snake by tilting their phone. The gyroscope data from the device is captured in the browser and sent to the game logic in real time.

By transforming the phone into a physical interface, the project investigates how everyday devices can become interactive controllers for web-based games.

⸻

# Instructions (Operation Manual)

## Play Online

Open the game on your phone:

https://gluttonous-snake.onrender.com

## Steps
	1.	Open the webpage on a mobile phone.
	2.	The browser will ask for motion sensor permission. Please click Allow.
	3.	Tilt the phone to control the direction of the snake.
	4.	The snake will move across the screen and eat food that appears randomly.
	5.	Each time the snake eats food, it becomes longer and the score increases.
	6.	Avoid hitting the wall or the snake’s own body.
	7.	If the snake collides with a wall or itself, the game ends.

# Controls

## Phone tilt controls the snake:

Tilt phone left → snake moves left
Tilt phone right → snake moves right
Tilt phone forward → snake moves up
Tilt phone backward → snake moves down

⸻

# Technical Overview

## The project uses mobile motion sensing and web technologies to create an interactive game controller.

### Key technologies include:

• JavaScript for game logic
• DeviceMotion / DeviceOrientation API to read gyroscope data
• Web browser sensors for motion detection
• Render for server hosting and deployment

The phone acts as a motion input device, translating physical gestures into game control signals.

⸻

# How to Run Locally (Optional)

If you want to run the project locally:
	1.	Clone the repository
      git clone https://github.com/yyrzz0305/snake.git
    2.	Open the project folder.
	3.	Run a local web server (for example using VSCode Live Server).
	4.	Open the webpage on your phone using the same network.

⸻

# Acknowledgements

Online game version:
https://gluttonous-snake.onrender.com
Inspired by the classic Snake game and experiments with mobile device sensors as interactive controllers.
