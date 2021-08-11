export default class PDOStatement {
  setFetchMode(mode) {
    return true;
  }

  bindValue(parameter, value, data_type) {
    return true;
  }

  execute(input_parameters = null) {
    return true;
  }

  fetchAll(fetch_style, fetch_argument, ctor_args = []) {
    return [];
  }
}
