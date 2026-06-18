<div align="center">
    <img src="./docs/assets/good-twin.png" alt="Good Twin application home" width="400" height="200">
</div>

Um aplicativo implementado utilizando electron e distribuido em App Image e deb package.
Faz parte de um projeto maior para a disciplina de Interface Hardware-Software. 
Utiliza do char driver implementado para a placa DE2i-150 para ser manipulado pelo user.
Implementação dos drivers (github.com/loki0b/fpga-device-driver)

São implementadas algumas funções em python que são gerenciados pelo proprio electron.
Temos as features de scanning, criação de AP e client monitor.

O processo de rendering utiliza react
O processo main expões algumas APIs para o processo de rendering utilizando IPC para o usuario conseguir interagir tanto com a placa (para manipulação na aplicação) como acessar as features disponiveis pela aplicação.