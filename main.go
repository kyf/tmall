package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	. "log"
	"net/http"
	"os"
	"strings"
)

func main() {
	finfos, err := ioutil.ReadDir("./data")
	if err != nil {
		Print(err.Error())
		return
	}
	dirs := []string{"big", "detail"}
	for _, info := range finfos {
		for _, d := range dirs {
			big := "./data/" + info.Name() + "/" + d + "/list.txt"
			body, err := ioutil.ReadFile(big)
			if err != nil {
				Print(err.Error())
				continue
			}
			//Print(string(body))
			var list []string
			err = json.Unmarshal(body, &list)
			if err != nil {
				Print(err.Error())
				continue
			}
			saveImg(list, "./data/"+info.Name()+"/"+d)
		}
	}
}

func saveImg(imgs []string, dir string) {
	for index, img := range imgs {
		uri := img
		if !strings.HasPrefix(img, "https:") {
			uri = "https:" + img
		}
		resp, err := http.Get(uri)
		if err != nil {
			Print(err.Error)
			continue
		}
		body, err := ioutil.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			Print(err.Error())
			continue
		}
		filename := fmt.Sprintf("%s/%d.jpg", dir, index)
		ioutil.WriteFile(filename, body, os.ModePerm)
	}
}
