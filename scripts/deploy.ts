const ABC = artifacts.require("ABCToken");

const main = async () => {
  return ABC.new();
};

main()
  .then((abc) => {
    console.log("contract deployed to address ->", abc.address);
    process.exit(0);
  })
  .catch((err) => {
    console.log("Error is ->", err);
    process.exit(1);
  });
