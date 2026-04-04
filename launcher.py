import tkinter as tk
from tkinter import scrolledtext
from tkinter import ttk
import subprocess
import threading
import os
import sys
import shutil
import time

# Constants for Paths
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "Trading-Project", "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "Trading-Project", "frontend")

# Use .venv python executable to ensure dependencies are loaded
PYTHON_EXEC = os.path.join(ROOT_DIR, ".venv", "Scripts", "python.exe")
if not os.path.exists(PYTHON_EXEC):
    PYTHON_EXEC = sys.executable  # Fallback

class DashboardLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("TradingView Scraper Dashboard Launcher")
        self.root.geometry("800x600")
        self.root.configure(bg="#1e1e2e")
        
        # Style
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TButton", padding=6, font=('Helvetica', 12, 'bold'), background="#282a36", foreground="#f8f8f2")
        style.map("TButton", background=[("active", "#44475a")])
        style.configure("TLabel", background="#1e1e2e", foreground="#f8f8f2", font=('Helvetica', 12))
        
        # Frame for controls
        top_frame = tk.Frame(self.root, bg="#1e1e2e")
        top_frame.pack(side=tk.TOP, fill=tk.X, padx=10, pady=10)
        
        # Backend buttons
        self.lbl_backend = ttk.Label(top_frame, text="Backend: Stopped", foreground="#ffb86c")
        self.lbl_backend.grid(row=0, column=0, padx=10, pady=5, sticky=tk.W)
        
        self.btn_backend = ttk.Button(top_frame, text="Start Backend", command=self.toggle_backend)
        self.btn_backend.grid(row=0, column=1, padx=10, pady=5)
        
        # Frontend buttons
        self.lbl_frontend = ttk.Label(top_frame, text="Frontend: Stopped", foreground="#ffb86c")
        self.lbl_frontend.grid(row=1, column=0, padx=10, pady=5, sticky=tk.W)
        
        self.btn_frontend = ttk.Button(top_frame, text="Start Frontend", command=self.toggle_frontend)
        self.btn_frontend.grid(row=1, column=1, padx=10, pady=5)
        
        # Start/Stop All
        self.btn_all_start = ttk.Button(top_frame, text="Start All", command=self.start_all)
        self.btn_all_start.grid(row=0, column=2, padx=20, pady=5, sticky=tk.NS)
        
        self.btn_all_stop = ttk.Button(top_frame, text="Stop All", command=self.stop_all)
        self.btn_all_stop.grid(row=1, column=2, padx=20, pady=5, sticky=tk.NS)
        # Log Text Box
        self.log_area = scrolledtext.ScrolledText(self.root, wrap=tk.WORD, bg="#282a36", fg="#f8f8f2", font=("Consolas", 10))
        self.log_area.pack(side=tk.BOTTOM, fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Processes
        self.process_backend = None
        self.process_frontend = None
        
        self.log("Launcher ready.\n")
        
        # Override window close behavior
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def log(self, message):
        self.log_area.insert(tk.END, message)
        self.log_area.see(tk.END)

    def append_log_thread_safe(self, message):
        self.root.after(0, self.log, message)

    def read_output(self, process, prefix):
        """Read stdout/stderr from process line by line."""
        try:
            for line in iter(process.stdout.readline, b''):
                decoded_line = line.decode('utf-8', errors='replace')
                self.append_log_thread_safe(f"[{prefix}] {decoded_line}")
        except ValueError:
            pass # Handle closed file

    def toggle_backend(self):
        if self.process_backend is None or self.process_backend.poll() is not None:
            # Start Backend
            self.log("Starting backend...\n")
            try:
                # CreationFlags=subprocess.CREATE_NO_WINDOW is Windows specific to hide console
                creationflags = getattr(subprocess, 'CREATE_NO_WINDOW', 0x08000000)
                
                self.process_backend = subprocess.Popen(
                    [PYTHON_EXEC, "server.py"],
                    cwd=BACKEND_DIR,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    stdin=subprocess.PIPE,
                    creationflags=creationflags
                )
                
                threading.Thread(target=self.read_output, args=(self.process_backend, "BACKEND"), daemon=True).start()
                
                self.lbl_backend.config(text="Backend: Running", foreground="#50fa7b")
                self.btn_backend.config(text="Stop Backend")
            except Exception as e:
                self.log(f"Failed to start backend: {e}\n")
        else:
            # Stop Backend
            self.log("Stopping backend...\n")
            try:
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(self.process_backend.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception as e:
                self.log(f"Error terminating backend: {e}\n")

            self.process_backend = None
            self.lbl_backend.config(text="Backend: Stopped", foreground="#ffb86c")
            self.btn_backend.config(text="Start Backend")

    def toggle_frontend(self):
        if self.process_frontend is None or self.process_frontend.poll() is not None:
            # Start Frontend
            self.log("Starting frontend...\n")
            try:
                # Find the full path to npm or yarn
                exec_name = "yarn.cmd" if os.path.exists(os.path.join(FRONTEND_DIR, "yarn.lock")) else "npm.cmd"
                exec_path = shutil.which(exec_name)
                
                if not exec_path:
                    # Fallback to just the name if shutil.which fails
                    exec_path = exec_name

                creationflags = getattr(subprocess, 'CREATE_NO_WINDOW', 0x08000000)
                full_cmd = f'"{exec_path}" start'
                self.log(f"Executing: {full_cmd}\n")
                
                self.process_frontend = subprocess.Popen(
                    full_cmd,
                    cwd=FRONTEND_DIR,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    stdin=subprocess.PIPE,
                    creationflags=creationflags,
                    shell=True
                )
                
                threading.Thread(target=self.read_output, args=(self.process_frontend, "FRONTEND"), daemon=True).start()
                
                self.lbl_frontend.config(text="Frontend: Running", foreground="#50fa7b")
                self.btn_frontend.config(text="Stop Frontend")
            except Exception as e:
                self.log(f"Failed to start frontend: {e}\n")
            
        else:
            # Stop Frontend
            try:
                self.log(f"Killing Frontend PID {self.process_frontend.pid}...\n")
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(self.process_frontend.pid)], 
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                time.sleep(0.5) # Give it a moment to die
            except Exception as e:
                self.log(f"Error terminating frontend: {e}\n")
            self.process_frontend = None
            self.lbl_frontend.config(text="Frontend: Stopped", foreground="#ffb86c")
            self.btn_frontend.config(text="Start Frontend")

    def start_all(self):
        if self.process_backend is None or self.process_backend.poll() is not None:
            self.toggle_backend()
        
        if self.process_frontend is None or self.process_frontend.poll() is not None:
            self.toggle_frontend()

    def stop_all(self):
        self.log("Stopping all services...\n")
        if self.process_backend is not None:
            self.toggle_backend()
        if self.process_frontend is not None:
            self.toggle_frontend()
        
        # Aggressive cleanup for Windows: kill any remaining node or python processes in these folders?
        # No, let's just stick to the PIDs for now but ensure they are cleared.

    def on_closing(self):
        self.log("Shutting down processes...\n")
        self.stop_all()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = DashboardLauncher(root)
    root.mainloop()
