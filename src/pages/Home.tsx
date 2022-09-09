import InputEdit from "@/comp/InputEdit";
import ProxyForm from "@/comp/ProxyForm";
import { ipcRenderer as ip } from "electron";

import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Drawer,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
} from "antd";
import dayjs from "dayjs";
import { ProfileType } from "electron/type";
import _ from "lodash";
import { useState, useEffect, useContext } from "react";
import { messageDone, messageError, messgeNotWorking } from "@/message";
import { useNavigate } from "react-router-dom";


const Home = ({setLoading}: {setLoading: Function}) => {
  const navigate = useNavigate();
  const [browsers, setBrowsers] = useState<Array<any>>([]);
  const [showProxyForm, setShowProxyForm] = useState(false);
  const [browserEdit, setBrowserEdit] = useState({});
  const [rowSel, setRowSel] = useState<React.Key[]>([]);
  const fetchProfile = async (updItem?: ProfileType) => {
    setLoading(true);
    if (updItem) {
      return setBrowsers([
        ...browsers.filter((e) => e.id != updItem.id),
        updItem,
      ]);
    }

    let data: Array<ProfileType> = await ip.invoke("load-profile");
    data = _.orderBy(
      data,
      [({ createdAt }) => createdAt || "", "name"],
      ["desc", "asc"]
    );

    setBrowsers(data);
    setLoading(false);
  };

  const getAuth=  async () => {
    let auth = await ip.invoke('auth-get')
    if(!auth?.active) {
      navigate('/account')
    }
  }

  useEffect(() => {
    console.log('launch home');
    getAuth().then(() => {
      fetchProfile()
    })
  }, []);

  const openProxyForm = (data: ProfileType) => {
    setBrowserEdit(data);
    setShowProxyForm(true);
  };

  const onSubmitProxy = async (proxy: any, item: ProfileType) => {
    await fetchProfile().then((e) => {
      setShowProxyForm(false);
    });
  };

  const runBrowser = async () => {
    console.log("run");
    const [id] = rowSel;
    try {
      await ip.invoke("run-browser", { id });
      await fetchProfile();

      let {name}  = _.find(browsers, {id})
      messageDone(`${name} đang khởi động, hãy chờ 1 tí`)

    } catch (ex) {
      messageError();
    }
  };

  const addProfile = async () => {
    setLoading(true);

    let name  = await ip.invoke("new-profile", {});
    await fetchProfile();

    setLoading(false);

    messageDone(name + ' đã được thêm!')
  };

  const importProfile = async () => {
    let src = await ip.invoke('open-file')
    console.log(src);

    if(!src) {
      messageError('Thư mục này không thể nạp (Thư mục phải chứa thư mục Default)')
      return Promise.resolve()
    }

    setLoading(true)
    try{
      await ip.invoke('import-profile', src)
    }catch(err){
      console.log(err);
      messageError('Nạp thư mục xảy ra lỗi. Làm ơn liên hệ admin để giải quyết')
    }

    setLoading(false)
    fetchProfile()
  }

  const delProfile = async () => {
    setLoading(true);
    const [id] = rowSel;
    let name = await ip.invoke("del-profile", { id });
    await fetchProfile();

    setLoading(false);
    messageDone(name + ' đã bị xóa!')
  };

  const isConfirmDel = () => {
    const [id] = rowSel;
    let e = _.find(browsers, { id });
    return !_.isEmpty(e?.lastRun);
  };

  const handleEditName = async (res: any) => {
    await fetchProfile();
  };

  const dispProxy = (e: ProfileType) => {
    if (_.isEmpty(e?.proxy) || _.isEmpty(e?.proxy.host)) return "-";

    if (["socks5", "socks4", 'http'].includes(e.proxy.mode)) {
      return `${e.proxy.mode}://${e.proxy.host}`;
    }

    return `${e.proxy.ip}`;
  };

  const cols = [
    {
      title: () => {
        return (
          <Row justify="space-between">
            <Col>
              <div>Tên</div>
            </Col>
            <Col>
              <Tag color="#108ee9">{browsers.length} hồ sơ</Tag>
            </Col>
          </Row>
        );
      },
      dataIndex: "name",
      key: "name",

      render: (_: any, e: any, idx: number) => (
        <Space size="middle">
          <InputEdit item={e} handleEditName={handleEditName} />
        </Space>
      ),
    },
    {
      title: "Proxy",
      key: "proxy",
      render: (_: any, e: any, idx: number) => (
        <Space key={e.id}>
          <div>{dispProxy(e)}</div>
          <EditOutlined
            style={{ cursor: "pointer" }}
            onClick={() => openProxyForm(e)}
          />
        </Space>
      ),
    },

    {
      title: "Chạy lúc",
      key: "last_run",
      render: (_: any, e: ProfileType, idx: any) =>
        e?.lastRun ? <span>{dayjs(e.lastRun).fromNow()}</span> : <span>-</span>,
    },
    {
      title: "Ngày tạo",
      key: "createdAt",
      render: (_: any, e: any, idx: any) => (
        <div>
          {dayjs(e.createdAt).format("DD/MM/YYYY")}
          <br />
          {dayjs(e.createdAt).format("HH:mm:ss")}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div>

      </div>
      <div>
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
          <Space  direction="vertical" size="middle" style={{ width: "100%" }}>
            <Row justify="space-between">
              <Col>
               <Space>
               <Button
                  size="large"
                  shape="round"
                  type="primary"
                  onClick={addProfile}
                >
                  Thêm
                </Button>

               </Space>
              </Col>
              <Col>
              <Button
                  size="large"
                  shape="round"
                  type="primary"
                  style={{'marginRight': 10}}
                  onClick={importProfile}
                >
                  Nạp
                </Button>
                <Space hidden={!rowSel.length}>
                  {isConfirmDel() ? (
                    <Popconfirm
                      placement="top"
                      title="Sẽ không thể khôi phục sau khi xóa!"
                      onConfirm={delProfile}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        shape="round"
                      >
                        Xóa
                      </Button>
                    </Popconfirm>
                  ) : (
                    <Button
                      type="primary"
                      danger
                      onClick={delProfile}
                      icon={<DeleteOutlined />}
                      shape="round"
                    >
                      Xóa
                    </Button>
                  )}

                  <Button
                    color="#fff"
                    shape="round"
                    type="primary"
                    onClick={messgeNotWorking}
                    icon={<DownloadOutlined />}
                  >
                    Tải
                  </Button>
                  <Button
                    type="primary"
                    shape="round"
                    size="large"
                    icon={<PoweroffOutlined />}
                    onClick={() => runBrowser()}
                  >
                    Chạy
                  </Button>
                </Space>
              </Col>
            </Row>

            <Table
              style={{ width: "100%" }}
              rowSelection={{
                type: "radio",
                selectedRowKeys: rowSel,
                onChange: (id) => setRowSel(id),
              }}
              onRow={(rc, _) => ({
                onClick: () => setRowSel([rc.id]),
              })}
              rowKey="id"
              columns={cols}
              dataSource={browsers}
            />
          </Space>
      </div>
    </div>
  );
};

export default Home;
