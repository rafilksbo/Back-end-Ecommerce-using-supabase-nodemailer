const knex = require("../conexao");
const supabase = require("../supabase");

const listarProdutos = async (req, res) => {
  const { usuario } = req;
  const { categoria } = req.query;

  try {
    const produtos = await knex("produtos")
      .where({ usuario_id: usuario.id })
      .where((query) => {
        if (categoria) {
          return query.where("categoria", "ilike", `%${categoria}%`);
        }
      });

    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const obterProduto = async (req, res) => {
  const { usuario } = req;
  const { id } = req.params;

  try {
    const produto = await knex("produtos")
      .where({
        id,
        usuario_id: usuario.id,
      })
      .first();

    if (!produto) {
      return res.status(404).json("Produto não encontrado");
    }

    return res.status(200).json(produto);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const cadastrarProduto = async (req, res) => {
  const { usuario } = req;
  let { nome, quantidade, preco, categoria, descricao, imagem, nome_imagem } =
    req.body;

  if (!nome) {
    return res.status(404).json("O campo nome é obrigatório");
  }

  if (!quantidade) {
    return res.status(404).json("O campo estoque é obrigatório");
  }

  if (!preco) {
    return res.status(404).json("O campo preco é obrigatório");
  }

  if (!descricao) {
    return res.status(404).json("O campo descricao é obrigatório");
  }

  try {
    if (imagem) {
      const buffer = Buffer.from(imagem, "base64");

      const { data, error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(nome, buffer);
      console.log("data: ", data);
      if (error) {
        return res.status(400).json(error.message);
      }

      const { publicURL, error: errorPublicUrl } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(nome);
      imagem = publicURL;
      if (errorPublicUrl) {
        return res.status(400).json(errorPublicUrl.message);
      }
    }

    const produto = await knex("produtos")
      .insert({
        usuario_id: usuario.id,
        nome,
        quantidade,
        preco,
        categoria,
        descricao,
        imagem,
      })
      .returning("*");

    if (!produto) {
      return res.status(400).json("O produto não foi cadastrado");
    }

    return res.status(200).json(produto);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const atualizarProduto = async (req, res) => {
  const { usuario } = req;
  const { id } = req.params;
  const { nome, estoque, preco, categoria, descricao, imagem } = req.body;

  if (imagem) {
    return res
      .status(404)
      .json(
        "Para atualizar a imagem, é necessário ir na guia específica para isso ('Upload de Imagem')"
      );
  }

  if (!nome && !estoque && !preco && !categoria && !descricao) {
    return res
      .status(404)
      .json("Informe ao menos um campo para atualizaçao do produto");
  }

  try {
    const produtoEncontrado = await knex("produtos")
      .where({
        id,
        usuario_id: usuario.id,
      })
      .first();

    if (!produtoEncontrado) {
      return res.status(404).json("Produto não encontrado");
    }

    const produto = await knex("produtos").where({ id }).update({
      nome,
      estoque,
      preco,
      categoria,
      descricao,
    });

    if (!produto) {
      return res.status(400).json("O produto não foi atualizado");
    }

    return res.status(200).json("produto foi atualizado com sucesso.");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const excluirProduto = async (req, res) => {
  const { usuario } = req;
  const { id } = req.params;

  try {
    const produtoEncontrado = await knex("produtos")
      .where({
        id,
        usuario_id: usuario.id,
      })
      .first();

    if (!produtoEncontrado) {
      return res.status(404).json("Produto não encontrado");
    }

    const produtoExcluido = await knex("produtos")
      .where({
        id,
        usuario_id: usuario.id,
      })
      .del();

    if (!produtoExcluido) {
      return res.status(400).json("O produto não foi excluido");
    }

    return res.status(200).json("Produto excluido com sucesso");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const uploadImagem = async (req, res) => {
  let { nome, imagem } = req.body;
  const { id } = req.usuario;

  if (!nome || !imagem) {
    return res
      .status(400)
      .json(
        "Para atualizar uma imagem, é necessário informar o nome e a imagem"
      );
  }

  const buffer = Buffer.from(imagem, "base64");

  try {
    const produtoAutenticado = await knex("produtos")
      .where({ usuario_id: id, nome })
      .first();

    if (!produtoAutenticado) {
      return res
        .status(403)
        .json("Não é possível atualizar  a imagem");
    }

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .update(nome, buffer);
    console.log(data);
    if (error) {
      return res.status(400).json(error.message);
    }

    const { publicURL, error: errorPublicUrl } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(nome);
    imagem = publicURL;
    if (errorPublicUrl) {
      return res.status(400).json(errorPublicUrl.message);
    }

    return res.status(200).json("Imagem atualizada com sucesso");
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const excluirImagem = async (req,res) =>{
  const {nome} = req.body
  const {id} = req.usuario

  const produtoAutenticado = await knex('produtos').where({usuario_id:id, nome}).first()
  
  if(!produtoAutenticado){
    res.status(403).json('Não é possível deletar a imagem')
  }

  try {
     const {error} = await supabase.storage.from(process.env.SUPABASE_BUCKET).remove([nome])

  if(error){
    return res.status(400).json(error.message)
  }

  const imagemExcluida = await knex('produtos').update({imagem:null}).where({usuario_id:id, nome}).returning('*')

  if(!imagemExcluida){
    return res.json('A imagem não pôde ser removida. Tente novamente')
  }

  return res.status(200).json(imagemExcluida)
  } catch (error) {
    return res.status(400).json(error.message)
  }
}

module.exports = {
  listarProdutos,
  obterProduto,
  cadastrarProduto,
  atualizarProduto,
  excluirProduto,
  uploadImagem,
  excluirImagem
};
