import { useEffect, useState } from "react";
import styles from "styles/app.module.scss";
import { ipcRenderer as ip, app } from "electron";
import _ from "lodash";

import { Select, Layout, Spin } from "antd";

import { Routes, Route, HashRouter } from "react-router-dom";

import { HeaderBar } from "./comp/Header";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import MenuBar from "./comp/Menu";
import Home from "./pages/Home";
import FeedBack from "./pages/Feedback";
import Login from "./pages/Login";
dayjs.locale("vi");
dayjs.extend(relativeTime);

const { Content, Footer } = Layout;

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState();

  const login = async () => {
    setLoading(true)
    let status = await ip.invoke("login");
    setLoading(false)
  };
  useEffect(() => {
    console.log("app launcher");
    login()
    getVersion()
  }, []);


  const getVersion = async () => {
    let v = await ip.invoke('version')
    setVersion(v)
  }
  return (
    <Layout style={{ flexDirection: "row" }}>
      <MenuBar />
      <Layout className="site-layout">
        <HeaderBar />
        <Content style={{ marginTop: "20px", padding: "10px" }}>
          <Spin spinning={loading}>
            <Routes>
              <Route index element={<Home setLoading={setLoading} />} />
              <Route
                path="/feedback"
                element={<FeedBack setLoading={setLoading} />}
              />
              <Route
                path="/account"
                element={<Login setLoading={setLoading} />}
              />
            </Routes>
          </Spin>
        </Content>
        <Footer>
          <span>Phiên bản: {version}</span>
        </Footer>
      </Layout>

    </Layout>
  );
};

export default App;
