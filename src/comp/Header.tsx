import {
  DisconnectOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Row, Col, Space, Layout, Select, Button } from "antd";
import { useEffect, useState } from "react";
import { ipcRenderer as ip } from "electron";

const { Header } = Layout;
const { Option } = Select;
const IP_CHECKER_URL = "http://www.geoplugin.net/json.gp";

interface IpInfo {
  geoplugin_request: string;
  geoplugin_delay: string;
  geoplugin_countryCode: string;
}

export const HeaderBar = () => {
  const [ipStatus, setIpStatus] = useState({});
  const [ipInfo, setIpInfo] = useState<IpInfo>();
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    checkIpInfo()
  }, [])

  const updateOnlineStatus = async () => {
    let status = navigator.onLine ? 1 : 0;
    setIpStatus(status);
  };

  const checkIpInfo = async () => {
    setLoading(true);
    try {
      let res = await fetch(IP_CHECKER_URL);
      setIpInfo(await res.json());
    } catch (e) {
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  };

  useEffect(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  }, []);

  return (
    <Header style={{ color: "#fff" }}>
      <Row justify="space-between">
        <Col>
          <h1 style={{ color: "#fff" }}>BÓNG MA</h1>
        </Col>
        <Col>
          <Space>
            {ipStatus ? (
              <Space>
                <SyncOutlined
                  spin={loading}
                  onClick={checkIpInfo}
                />
                <Space split="|">
                  <span>IP: {ipInfo?.geoplugin_request}</span>
                  <span>{ipInfo?.geoplugin_countryCode}</span>
                  <span>{ipInfo?.geoplugin_delay}</span>
                </Space>
              </Space>
            ) : (
              <>
                <DisconnectOutlined />
                <span>Mất mạng</span>
              </>
            )}
          </Space>
        </Col>
      </Row>
    </Header>
  );
};
