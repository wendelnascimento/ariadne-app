/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, WebView } from 'react-native';
import { RNCamera } from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob'
import styled from 'styled-components';
import Triangle from 'react-native-triangle';

import DashImage from './assets/Ep.png';
import BlueBall from './assets/Layer8.png';

const PopMessage = styled.View`
  background: rgba(79,84,94,.82);
  border: 6px solid #9df0ff;
  position: absolute;
  padding: 16px;
  top: ${props => props.y}px;
  left: ${props => props.y / 1.5}px;
  box-shadow: 6px 6px 20px rgba(157,240,255,1);
  max-width: ${Dimensions.get('window').width}px;
  z-index: 2000;
`;

const PopWebViewMessage = styled(PopMessage)`
  padding: 0;
  top: 16px;
  left: 16px;
  z-index: 3000;
`;

const StyledWebView = styled.WebView`
  width: ${Dimensions.get('window').width - 42}px
  height: ${Dimensions.get('window').height / 1.5 - 16}px;
  background: rgba(79,84,94,.82);
`;

const WhiteText = styled.Text`
  color: #fff;
  font-size: 16px;
`;

const PersonName = styled.Text`
  color: #fff;
  font-size: 20px;
  font-family: 'ProximaNovaT-Thin';
`;

const CompanyName = styled.Text`
  color: #fff;
  margin: 8px 0;
  font-size: 20px;
  font-family: 'ProximaNovaT-Thin';
  font-style: italic;
`;

const LinkText = styled.Text`
  color: #ffaaaa;
  margin: 16px 0;
  font-size: 20px;
  font-family: 'ProximaNovaT-Thin';
  text-decoration: underline;
  text-decoration-color: #ffaaaa;
`;

const CloseText = styled.Text`
  color: #9df0ff;
  position: absolute;
  bottom: -50px;
  right: 0;
  font-size: 16px;
  padding: 16px;
`;

const DashboardImage = styled.Image`
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 60%;
  height: 100px;
  resize-mode: contain;
`;

const BlueBallImage = styled.Image`
  width: 30px;
  height: 30px;
  resize-mode: contain;
  margin-right: 16px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ChatIndicator = styled(Triangle)`
  position: absolute;
  bottom: -16px;
  left: 50%;
`;

type Props = {};
export default class App extends Component<Props> {
  state = {
    faces: [],
    person: {
      id: '',
      name: '',
      extra: {},
    },
    searchingPerson: false,
    waitFix: false,
    webViewVisible: false,
    webViewLink: '',
  };

  camera = null;
  
  facesTimeout = null;

  identifyFace = async () => {
    const pic = await this.camera.takePictureAsync({
      base64: true,
      exif: true,
    });
    try {
      this.setState({ searchingPerson: true, waitFix: false });
      const detect = await RNFetchBlob.fetch('POST', 'https://southcentralus.api.cognitive.microsoft.com/face/v1.0/detect', {
        'Content-Type': 'application/octet-stream',
        'Ocp-Apim-Subscription-Key': '981defa5d77942429eaa5129389f5502',
      }, pic.base64);
      const detectJSON = await detect.json();
      if (detectJSON.length > 0) {
        const identify = await fetch('https://southcentralus.api.cognitive.microsoft.com/face/v1.0/identify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': '981defa5d77942429eaa5129389f5502',
          },
          body: JSON.stringify({
            faceIds: detectJSON.map(d => d.faceId),
            personGroupId: 'group1'
          }),
        });
        const identifyJSON = await identify.json();
        identifyJSON.forEach(i => {
          i.candidates.forEach(c => {
            fetch(`https://southcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/group1/persons/${c.personId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': '981defa5d77942429eaa5129389f5502',
              },
            })
            .then(res => res.json())
            .then(res => {
              this.setState({
                person: {
                  id: c.personId,
                  name: res.name,
                  extra: {
                    ...JSON.parse(res.userData),
                  },
                },
                searchingPerson: false,
              });
            });
          });
        });
      } else {
        this.setState({ searchingPerson: false });
      }
    } catch(e) {
      // console.log(e)
    }
    // alert('5 seconds with a face');
  };

  handleFaceDetect = (e) => {
    this.setState({
      faces: e.faces,
    });
    if (!this.facesTimeout && e.faces.length > 0) {
      this.facesTimeout = setTimeout(() => {
        this.identifyFace();
      }, 2000);
      this.setState({
        waitFix: true,
      });
    } else if (this.facesTimeout && e.faces.length === 0) {
      clearTimeout(this.facesTimeout);
      this.facesTimeout = null;
      this.setState({
        person: {
          id: '',
          name: '',
          extra: {},
        },
        waitFix: false,
      });
    }
  }

  handleFaceDetectError = (e) => {
    // console.log(e);
  }

  showWebView = (link) => {
    this.setState({
      webViewVisible: true,
      webViewLink: link,
    });
  }

  closeWebView = () => {
    this.setState({
      webViewVisible: false,
      webViewLink: '',
    });
  }

  renderPersonInfo() {
    if (!this.state.person.id) {
      return null;
    }
    return (
      <React.Fragment>
        <Row>
          <BlueBallImage source={BlueBall} />
          <PersonName>That's {this.state.person.name}</PersonName>
        </Row>
        {
          this.state.person.extra.designation &&
          <CompanyName>{this.state.person.extra.designation} of {this.state.person.extra.company}</CompanyName>
        }
        {
          this.state.person.extra.link &&
          <TouchableOpacity onPress={() => this.showWebView(this.state.person.extra.link.data)}>
            <LinkText>{this.state.person.extra.link.text}</LinkText>
          </TouchableOpacity>
        }
      </React.Fragment>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style = {styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.off}
          permissionDialogTitle={'Permission to use camera'}
          permissionDialogMessage={'We need your permission to use your camera phone'}
          onFacesDetected={this.handleFaceDetect}
          onFaceDetectionError={this.handleFaceDetectError}
          faceDetectionMode={RNCamera.Constants.FaceDetection.Mode.accurate}
          faceDetectionLandmarks={RNCamera.Constants.FaceDetection.Landmarks.all}
          faceDetectionClassifications={RNCamera.Constants.FaceDetection.Classifications.all}
        />
        {
          this.state.faces.map(f => (
            <PopMessage
              key={f.faceID}
              x={f.bounds.origin.x}
              y={f.bounds.origin.y}
            >
              {
                this.renderPersonInfo()
              }
              {
                this.state.waitFix && <PersonName>Please wait...</PersonName>
              }
              {
                this.state.searchingPerson && <PersonName>Gathering person data</PersonName>
              }
              {
                f.smilingProbability * 100 > 70 && <WhiteText>Smile back!</WhiteText>
              }
              {
                f.rightEyeOpenProbability * 100 < 20 && <WhiteText>Right eye closed</WhiteText>
              }
              {
                f.leftEyeOpenProbability * 100 < 20 && <WhiteText>Left eye closed</WhiteText>
              }
              <ChatIndicator
                width={20}
                height={10}
                color="#9df0ff"
                direction="down"
              />
            </PopMessage>
          ))
        }
        {

        }
        {
          this.state.webViewVisible &&
          <PopWebViewMessage>
            <StyledWebView
              useWebKit
              source={{ uri: this.state.webViewLink }}
            />
            <TouchableOpacity onPress={this.closeWebView}>
              <CloseText>close</CloseText>
            </TouchableOpacity>
          </PopWebViewMessage>
        }
        <DashboardImage source={DashImage} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
});
