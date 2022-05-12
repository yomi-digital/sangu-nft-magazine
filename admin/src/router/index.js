import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/fix-price",
    name: "FixPrice",
    component: () =>
      import("../views/FixPrice.vue"),
  },
  {
    path: "/manage-whitelist",
    name: "ManageWhitelist",
    component: () =>
      import("../views/ManageWhitelist.vue"),
  },
  {
    path: "/manage-phases",
    name: "ManagePhases",
    component: () =>
      import("../views/ManagePhases.vue"),
  },
  {
    path: "/update-metadata",
    name: "UpdateMetadata",
    component: () =>
      import("../views/UpdateMetadata.vue"),
  },
  {
    path: "/withdraw",
    name: "Withdraw",
    component: () =>
      import("../views/Withdraw.vue"),
  },
  {
    path: "/buy",
    name: "Buy",
    component: () =>
      import("../views/Buy.vue"),
  },
  {
    path: "/drop-nft",
    name: "DropNft",
    component: () =>
      import("../views/DropNft.vue"),
  },
  {
    path: "/claim-nft",
    name: "ClaimNft",
    component: () =>
      import("../views/ClaimNft.vue"),
  },
];

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes,
});

export default router;
