import { Space, Switch } from "antd";
import { ProfileType } from "electron/type";
import { useState, useEffect } from "react";
import { ipcRenderer as ip } from "electron";


const SwitchRun = ({
  item,
  onUpdateRun,
}: {
  item: ProfileType;
  onUpdateRun: Function;
}) => {
  const [loading, setLoading] = useState(false);
  const [isRun, setIsRun] = useState(false);
  const [t, setT] = useState<ProfileType>();

  useEffect(() => {
    setT({ ...item });
    setIsRun(item.isRun || false);
  }, []);

  const onSwitch = async (val: boolean) => {
    setLoading(true);

    await ip
      .invoke("run-browser", { id: t?.id, run_flg: val })
      .then((res) => {
        setIsRun(res?.data?.isRun || false);
        onUpdateRun();
      })
      .finally(() => setLoading(false));
  };

  return (
    <Space size="middle">
      <Switch
        checked={isRun}
        checkedChildren="BẬT"
        unCheckedChildren="TẮT"
        defaultChecked={item.isRun}
        loading={loading}
        onChange={onSwitch}
      />
    </Space>
  );
};


export default SwitchRun
