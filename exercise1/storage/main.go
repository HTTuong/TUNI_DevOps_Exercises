package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"sync"
)

var (
	logFile = "/data/storage.log"
	mutex   sync.Mutex
)

func appendToFile(filename, content string) error {
	mutex.Lock()
	defer mutex.Unlock()
	
	file, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer file.Close()
	
	_, err = file.WriteString(content + "\n")
	return err
}

func readFile(filename string) (string, error) {
	mutex.Lock()
	defer mutex.Unlock()
	
	content, err := ioutil.ReadFile(filename)
	if err != nil {
		if os.IsNotExist(err) {
			return "", nil
		}
		return "", err
	}
	return string(content), nil
}

func logHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	
	switch r.Method {
	case http.MethodPost:
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Error reading body", http.StatusBadRequest)
			return
		}
		
		err = appendToFile(logFile, string(body))
		if err != nil {
			http.Error(w, "Error writing to file", http.StatusInternalServerError)
			return
		}
		
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "Logged successfully")
		
	case http.MethodGet:
		content, err := readFile(logFile)
		if err != nil {
			http.Error(w, "Error reading log", http.StatusInternalServerError)
			return
		}
		
		fmt.Fprint(w, content)
		
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func main() {
	http.HandleFunc("/log", logHandler)
	fmt.Println("Storage service starting on port 3002...")
	http.ListenAndServe(":3002", nil)
}
