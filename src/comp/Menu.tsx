import { DesktopOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { Menu, MenuProps } from "antd";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type MenuItem = Required<MenuProps>["items"][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}

const items: MenuItem[] = [
  getItem("Trình Duyệt", "/", <DesktopOutlined />),
  getItem("Ý kiến", "/feedback", <MailOutlined />),
  getItem("Tài khoản", "/account", <UserOutlined />),
];


const MenuBar: React.FC = () => {
  const navigate = useNavigate();
  const [pathName, setPathName] = useState<Array<string>>()
  const location = useLocation()

  useEffect(() => {
    setPathName([location.pathname])
  },[location])

  const onSelect = ({ key }: any) => {
    navigate(key);
  };

  return (
    <Menu
      style={{'height': '100vh'}}
      selectedKeys={pathName}
      mode="inline"
      theme="dark"
      inlineCollapsed={true}
      items={items}
      onSelect={onSelect}
    />
  );
};

export default MenuBar;
