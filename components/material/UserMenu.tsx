import React from "react";
import { Avatar, Menu, Typography, Icon, Button, Box, Tabs, Tab, styled } from "@mui/material";
import { NavItem, AppList } from "./";
import { ChurchInterface } from "../../interfaces";
import { ChurchList } from "./ChurchList";
import { SupportModal } from "../../pageComponents/components/SupportModal";

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const StyledMenu = styled(Menu)(
  ({ theme }) => ({
    "& .MuiPaper-root": {
      backgroundColor: theme.palette.secondary.main
    },
    "& .MuiListItemButton-root, & .MuiListItemIcon-root, & .MuiButtonBase-root": { color: "#FFFFFF" },
    "& .Mui-selected": { borderBottomColor: "#FFFFFF" }
  })
);

interface Props {
  userName: string;
  profilePicture: string;
  churches: ChurchInterface[];
  currentChurch: ChurchInterface;
}

export const UserMenu: React.FC<Props> = (props) => {
  const userName = props.userName;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [showSupport, setShowSupport] = React.useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getMainLinks = () => {
    if (props.churches.length < 2) return null;
    else {
      let result: JSX.Element[] = [];
      result.push(<NavItem url="/profile" label="Profile" icon="person" />);
      result.push(<NavItem url="/logout" label="Logout" icon="logout" />);
      result.push(<NavItem url="" label="Support" icon="help" onClick={() => { setShowSupport(true) }} />);
      return result;
    }
  }

  const getProfilePic = () => {
    if (props.profilePicture) return <img src={props.profilePicture} alt="user" style={{ maxHeight: 32 }} />
    else return <Icon>person</Icon>
  }

  const paperProps = {
    elevation: 0,
    sx: {
      overflow: "visible",
      filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
      mt: 1.5,
      "& .MuiAvatar-root": { width: 32, height: 32, ml: -0.5, mr: 1 },
      minWidth: 350
    }
  };

  const handleItemClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log(e);
  }

  const [tabIndex, setTabIndex] = React.useState(0);

  function handleChange(el: any, newValue: any) {
    setTabIndex(newValue);
  }

  const getTabs = () => (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs variant="fullWidth" value={tabIndex} onChange={handleChange} aria-label="basic tabs example">
        <Tab label="Actions" />
        <Tab label="Church" />
        <Tab label="App" />
      </Tabs>
      <TabPanel value={tabIndex} index={0}>
        {getMainLinks()}
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <ChurchList churches={props.churches} currentChurch={props.currentChurch} />
      </TabPanel>
      <TabPanel value={tabIndex} index={2}>
        <AppList />
      </TabPanel>
    </Box>
  );

  return (
    <>
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      <Button onClick={handleClick} color="inherit" aria-controls={open ? "account-menu" : undefined} aria-haspopup="true" aria-expanded={open ? "true" : undefined} style={{ textTransform: "none" }} endIcon={<Icon>expand_more</Icon>}>
        <Avatar sx={{ width: 32, height: 32, marginRight: 1 }}>{getProfilePic()}</Avatar>
        <Typography color="inherit" noWrap>{userName}</Typography>
      </Button>

      <StyledMenu anchorEl={anchorEl} id="account-menu" open={open} onClose={handleClose} onClick={(e) => { handleItemClick(e) }} PaperProps={paperProps} transformOrigin={{ horizontal: "right", vertical: "top" }} anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
        {getTabs()}

      </StyledMenu>
    </>
  );
};