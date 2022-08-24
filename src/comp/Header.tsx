import { WifiOutlined, DisconnectOutlined } from "@ant-design/icons";
import { Row, Col, Space, Layout, Select } from "antd";
import { useEffect, useState } from "react";

const { Header, Content, Footer } = Layout;
const { Option } = Select;

export interface IpInfo {
  ip: string;
  country: string;
}

export const HeaderBar = () => {
  const [ipStatus, setIpStatus] = useState({});
  const [ipInfo, setIpInfo] = useState<IpInfo>();

  const updateOnlineStatus = async () => {
    let status = navigator.onLine ? 1 : 0;
    setIpStatus(status);
  };

  useEffect(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
  }, []);

  return (
    <Header style={{ color: "#fff" }}>
      <Row justify="space-between">
        <Col></Col>
        <Col>
          <h1 style={{ color: "#fff" }}>BÓNG MA</h1>
        </Col>
        <Col>
          <Space>
            {ipStatus ? (
              <>
                <WifiOutlined style={{ color: "green" }} />
                <span>IP: {ipInfo?.ip}</span>
                <span>|</span>
                <span>{ipInfo?.country}</span>
              </>
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
