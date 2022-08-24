import { useEffect, useState } from "react";
import styles from "styles/app.module.scss";
import { ipcRenderer as ip } from "electron";

import {
  Space,
  Table,
  Tag,
  Button,
  Form,
  Switch,
  Modal,
  Input,
  Select,
  Drawer,
  Tooltip,
  Row,
  Col,
  Layout,
} from "antd";
import { ProfileType } from "../electron/type";
import {
  AudioOutlined,
  CloseCircleOutlined,
  DisconnectOutlined,
  EditOutlined,
  InfoCircleOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { async } from "node-stream-zip";
import axios from "axios";
import ProxyForm from "./comp/ProxyForm";
import { HeaderBar } from "./comp/Header";
import InputEdit from "./comp/InputEdit";
import SwitchRun from "./comp/SwitchRun";
const { Header, Content, Footer } = Layout;
const { Option } = Select;

const IP_CHECKER_URL = "http://www.geoplugin.net/json.gp";

const checkIp = async (ip = undefined) => {
  let checkUrl = IP_CHECKER_URL;
  if (ip) {
    checkUrl = `${IP_CHECKER_URL}?ip=${ip}`;
  }
  let res = await fetch(checkUrl);

  return await res.json();
};

const App: React.FC = () => {
  const [browsers, setBrowsers] = useState<Array<any>>([]);
  const [showProxyForm, setShowProxyForm] = useState(false);
  const [browserEdit, setBrowserEdit] = useState({});

  const fetchProfile = async (updItem?: ProfileType) => {
    if (updItem) {
      return setBrowsers([
        ...browsers.filter((e) => e.id != updItem.id),
        updItem,
      ]);
    }

    let data: Array<ProfileType> = await ip.invoke("load-profile");
    setBrowsers(data);
  };

  useEffect(() => {
    fetchProfile();
  }, []);


  const openProxyForm = (data: ProfileType) => {
    setBrowserEdit(data);
    setShowProxyForm(true);
  };

  const onSubmitProxy = async (proxy: any, item: ProfileType) => {
    await fetchProfile().then(e => {
      setShowProxyForm(false)
    })
  };


  const checkProxy = async () => {
    let res = await ip.invoke("proxy-checker");
    console.log(res);
  };

  const handleEditName = async (res: any) => {
    await fetchProfile();
  }

  const onUpdateRun = async () => {
    await fetchProfile();
  };

  const dispProxy = (e: ProfileType) => {
    if(!e?.proxy) return '-'

    if(['socks5', 'socks4'].includes(e.proxy.type)) {
      return `${e.proxy.type}://${e.proxy.ip}`
    }

    return `${e.proxy.ip}`
  }

  const cols = [
    {
      title: "Bật/Tắt",
      key: "status",
      render: (_: any, e: any, idx: any) => (
        <SwitchRun key={e.id} item={e} onUpdateRun={onUpdateRun} />
      ),
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",

      render: (_: any, e: any, idx: number) => (
        <Space size='middle'>
          <InputEdit item={e} handleEditName={handleEditName}/>
        </Space>
      ),
    },
    {
      title: "Proxy",
      key: "proxy",
      render: (_: any, e: any, idx: number) => (
        <Space  key={e.id}>
          <div>{dispProxy(e)}</div>
          <EditOutlined style={{'cursor': 'pointer'}} onClick={() => openProxyForm(e)} />
        </Space>
      ),
    },
    // {
    //   title: "dump",
    //   key: "p",
    //   render: (_: any, e: any, idx: any) => <div>{JSON.stringify(e)}</div>,
    // },
  ];

  return (
    <Layout>
      <HeaderBar />
      <Content style={{ marginTop: "20px" }}>
        <Drawer
          placement="right"
          closable={false}
          onClose={() => {
            setShowProxyForm(false);
          }}
          visible={showProxyForm}
        >
          <ProxyForm
            onSubmitProxy={onSubmitProxy}
            item={browserEdit}
          ></ProxyForm>
        </Drawer>
        <Space direction="vertical">
          <Button>Thêm mới</Button>
          <Table rowKey="id" columns={cols} dataSource={browsers} />
        </Space>
      </Content>
      <Footer></Footer>
    </Layout>
  );
};

export default App;
