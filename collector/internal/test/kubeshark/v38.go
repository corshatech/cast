/*
Copyright 2023 Corsha.
Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// kubeshark implements a test service that mimics the Kubeshark 38 Hub API
package kubeshark

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
	"github.com/julienschmidt/httprouter"
	"github.com/sirupsen/logrus"
)

type Service struct {
	Handler http.Handler

	messages chan string
	data     map[string]string
}

// New creates a new
func New() *Service {
	service := &Service{
		messages: make(chan string, 100),
		data:     map[string]string{},
		Handler:  nil,
	}

	router := httprouter.New()
	router.GET("/ws", service.echo)
	router.GET("/item/:worker/:id", service.item)

	service.Handler = router

	return service
}

type Message struct {
	Id string `json:"id"`
}

func (service *Service) Send(messageJson string, pcapJson string) {
	message := Message{}
	err := json.Unmarshal([]byte(messageJson), &message)
	if err != nil {
		logrus.WithError(err).Debug("error parsing test message Json")
	}
	service.messages <- messageJson
	service.data[message.Id] = pcapJson
}

var upgrader = websocket.Upgrader{}

func (service *Service) echo(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer c.Close()
	for {
		message := <-service.messages
		err = c.WriteMessage(websocket.TextMessage, []byte(message))
		if err != nil {
			break
		}
	}
}

func (service *Service) item(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	key := fmt.Sprintf("%s/%s", ps.ByName("worker"), ps.ByName("id"))
	pcap, found := service.data[key]
	if !found {
		w.WriteHeader(404)
		return
	}
	fmt.Fprintf(w, "%s", pcap)
}
