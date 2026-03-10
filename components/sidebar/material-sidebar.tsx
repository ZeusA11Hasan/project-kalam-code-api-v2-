"use client"

import React from "react"
import {
  List,
  Card,
  Alert,
  Avatar,
  ListItem,
  Accordion,
  Typography,
  AccordionBody,
  ListItemPrefix
} from "@material-tailwind/react"
import {
  TicketIcon,
  UserGroupIcon,
  Square2StackIcon,
  RectangleGroupIcon,
  ChatBubbleLeftEllipsisIcon
} from "@heroicons/react/24/solid"
import {
  ChevronDownIcon,
  ArrowLeftStartOnRectangleIcon
} from "@heroicons/react/24/outline"

export default function MaterialSidebar() {
  const [open, setOpen] = React.useState(0)
  const [openAlert, setOpenAlert] = React.useState(true)

  const handleOpen = (value: number) => {
    setOpen(open === value ? 0 : value)
  }

  const LIST_ITEM_STYLES =
    "text-gray-500 hover:text-white focus:text-white active:text-white hover:bg-opacity-20 focus:bg-opacity-20 active:bg-opacity-20"

  return (
    <Card
      color="gray"
      className="shadow-blue-gray-900/5 size-full rounded-none border-r border-white/10 bg-[#171717] p-4 shadow-xl"
    >
      <div className="mb-2 flex items-center gap-4 p-4">
        <img
          src="https://www.material-tailwind.com/logos/mt-logo.png"
          alt="brand"
          className="size-8"
        />
        <Typography className="text-lg font-bold text-gray-300">
          Chat Tutor
        </Typography>
      </div>
      <hr className="my-2 border-gray-800" />
      <List>
        <Accordion open={open === 1}>
          <ListItem
            selected={open === 1}
            data-selected={open === 1}
            onClick={() => handleOpen(1)}
            className="select-none p-3 text-gray-500 hover:bg-opacity-20 hover:text-white focus:bg-opacity-20 focus:text-white active:bg-opacity-20 active:text-white data-[selected=true]:bg-gray-50/20 data-[selected=true]:text-white"
          >
            <ListItemPrefix>
              <Avatar
                size="sm"
                src="https://www.material-tailwind.com/img/avatar1.jpg"
              />
            </ListItemPrefix>
            <Typography className="mr-auto font-normal text-inherit">
              Brooklyn Alice
            </Typography>
            <ChevronDownIcon
              strokeWidth={3}
              className={`ml-auto size-4 text-gray-500 transition-transform${open === 1 ? "rotate-180" : ""}`}
            />
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0">
              <ListItem className={`px-16 ${LIST_ITEM_STYLES}`}>
                My Profile
              </ListItem>
              <ListItem className={`px-16 ${LIST_ITEM_STYLES}`}>
                Settings
              </ListItem>
            </List>
          </AccordionBody>
        </Accordion>
        <hr className="my-2 border-gray-800" />
        <Accordion open={open === 2}>
          <ListItem
            selected={open === 2}
            data-selected={open === 2}
            onClick={() => handleOpen(2)}
            className="select-none px-3 py-[9px] text-gray-500 hover:bg-opacity-20 hover:text-white focus:bg-opacity-20 focus:text-white active:bg-opacity-20 active:text-white data-[selected=true]:bg-gray-50/20 data-[selected=true]:text-white"
          >
            <ListItemPrefix>
              <RectangleGroupIcon className="size-5" />
            </ListItemPrefix>
            <Typography className="mr-auto font-normal text-inherit">
              Dashboard
            </Typography>
            <ChevronDownIcon
              strokeWidth={3}
              className={`ml-auto size-4 text-gray-500 transition-transform${open === 2 ? "rotate-180" : ""}`}
            />
          </ListItem>
          <AccordionBody className="py-1">
            <List className="p-0">
              <ListItem className={`px-12 ${LIST_ITEM_STYLES}`}>
                Analytics
              </ListItem>
              <ListItem className={`px-12 ${LIST_ITEM_STYLES}`}>Sales</ListItem>
            </List>
          </AccordionBody>
        </Accordion>
        <ListItem className={LIST_ITEM_STYLES}>
          <ListItemPrefix>
            <Square2StackIcon className="size-5" />
          </ListItemPrefix>
          Products
        </ListItem>
        <ListItem className={LIST_ITEM_STYLES}>
          <ListItemPrefix>
            <TicketIcon className="size-5" />
          </ListItemPrefix>
          Orders
        </ListItem>
        <ListItem className={LIST_ITEM_STYLES}>
          <ListItemPrefix>
            <UserGroupIcon className="size-5" />
          </ListItemPrefix>
          Customers
        </ListItem>
      </List>
      <hr className="my-2 border-gray-800" />
      <List>
        <ListItem className={LIST_ITEM_STYLES}>
          <ListItemPrefix>
            <ChatBubbleLeftEllipsisIcon className="size-5" />
          </ListItemPrefix>
          Help & Support
        </ListItem>
        <ListItem className={LIST_ITEM_STYLES}>
          <ListItemPrefix>
            <ArrowLeftStartOnRectangleIcon
              strokeWidth={2.5}
              className="size-5"
            />
          </ListItemPrefix>
          Sign Out
        </ListItem>
      </List>
      <Alert open={openAlert} className="mt-auto bg-gray-800" variant="ghost">
        <Typography variant="small" color="white" className="mb-1 font-bold">
          New Version Available
        </Typography>
        <Typography variant="small" color="white" className="font-normal">
          Update your app and enjoy the new features and improvements.
        </Typography>
        <div className="mt-4 flex gap-4">
          <Typography
            as="a"
            href="#"
            variant="small"
            color="white"
            className="font-normal"
            onClick={() => setOpenAlert(false)}
          >
            Dismiss
          </Typography>
          <Typography
            as="a"
            href="#"
            variant="small"
            color="white"
            className="font-medium"
          >
            Upgrade Now
          </Typography>
        </div>
      </Alert>
      <Typography
        variant="small"
        className="mt-5 flex justify-center font-medium text-gray-400"
      >
        mt v2.1.2
      </Typography>
    </Card>
  )
}
